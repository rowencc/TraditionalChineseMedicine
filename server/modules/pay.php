<?php
/**
 * 虚拟支付模块 - 代币充值系统
 * 支持：下单、发货推送、查单、余额查询、免费次数查询
 */
$action = $_GET['action'] ?? '';
$db = Core\Database::getInstance();

// 获取支付配置
function getPayConfig($key) {
    $db = Core\Database::getInstance();
    $row = $db->query("SELECT config_value FROM pay_config WHERE config_key = ? LIMIT 1", [$key]);
    return $row[0]['config_value'] ?? '';
}

// 获取所有道具配置
function getProductList() {
    $db = Core\Database::getInstance();
    $rows = $db->query("SELECT config_key, config_value FROM pay_config WHERE config_key LIKE 'product_%' ORDER BY config_key");
    $products = [];
    foreach ($rows as $row) {
        $info = json_decode($row['config_value'], true);
        if ($info) {
            $products[] = $info;
        }
    }
    return $products;
}

// 计算支付签名 paySig
function calcPaySig($uri, $postBody, $appKey) {
    $msg = $uri . '&' . $postBody;
    return hash_hmac('sha256', $msg, $appKey);
}

// 计算用户态签名 signature
function calcSignature($postBody, $sessionKey) {
    return hash_hmac('sha256', $postBody, $sessionKey);
}

// 生成唯一订单号
function generateOutTradeNo() {
    return 'T' . date('YmdHis') . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
}

switch ($action) {
    // ========== 获取充值套餐列表 ==========
    case 'products':
        $products = getProductList();
        Core\Response::success('获取成功', $products);
        break;

    // ========== 获取用户代币余额 ==========
    case 'balance':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];

        $row = $db->query("SELECT balance, total_recharged, total_consumed FROM user_coins WHERE user_id = ?", [$userId]);
        $balance = $row[0]['balance'] ?? 0;
        $totalRecharged = $row[0]['total_recharged'] ?? 0;
        $totalConsumed = $row[0]['total_consumed'] ?? 0;

        // 查询今日免费次数
        $today = date('Y-m-d');
        $freeRow = $db->query("SELECT used_count FROM daily_free_usage WHERE user_id = ? AND usage_date = ?", [$userId, $today]);
        $freeUsed = $freeRow[0]['used_count'] ?? 0;
        $freeRemaining = max(0, 1 - $freeUsed);

        Core\Response::success('获取成功', [
            'balance' => (int)$balance,
            'total_recharged' => (int)$totalRecharged,
            'total_consumed' => (int)$totalConsumed,
            'free_remaining' => $freeRemaining,
            'free_used' => (int)$freeUsed
        ]);
        break;

    // ========== 查询今日免费次数 ==========
    case 'free_status':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];
        $today = date('Y-m-d');

        $freeRow = $db->query("SELECT used_count FROM daily_free_usage WHERE user_id = ? AND usage_date = ?", [$userId, $today]);
        $freeUsed = $freeRow[0]['used_count'] ?? 0;
        $freeRemaining = max(0, 1 - $freeUsed);

        Core\Response::success('获取成功', [
            'free_remaining' => $freeRemaining,
            'free_used' => (int)$freeUsed
        ]);
        break;

    // ========== 创建支付订单（下单） ==========
    case 'create_order':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];

        $productId = $_POST['product_id'] ?? '';
        if (empty($productId)) {
            Core\Response::error('请选择充值套餐');
            break;
        }

        // 查找对应道具配置
        $products = getProductList();
        $product = null;
        foreach ($products as $p) {
            if ($p['product_id'] === $productId) {
                $product = $p;
                break;
            }
        }

        if (!$product) {
            Core\Response::error('无效的充值套餐');
            break;
        }

        // 获取用户openid
        $userRow = $db->query("SELECT openid FROM users WHERE id = ?", [$userId]);
        $openid = $userRow[0]['openid'] ?? '';
        if (empty($openid)) {
            Core\Response::error('用户信息异常，请重新登录');
            break;
        }

        // 获取session_key（需要在登录时缓存）
        $sessionKey = $db->query("SELECT config_value FROM pay_config WHERE config_key = 'session_key_{$openid}' LIMIT 1");
        $sessionKeyValue = $sessionKey[0]['config_value'] ?? '';

        // 生成订单号
        $outTradeNo = generateOutTradeNo();

        // 自动清理超过10分钟的待支付订单（同一用户）
        $db->execute(
            "DELETE FROM pay_orders WHERE user_id = ? AND status = 0 AND create_time < DATE_SUB(NOW(), INTERVAL 10 MINUTE)",
            [$userId]
        );

        // 每次创建新订单（不复用旧订单，避免支付失败后无法重试）
        $db->execute(
            "INSERT INTO pay_orders (user_id, openid, out_trade_no, product_id, coins, amount, status, attach) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
            [$userId, $openid, $outTradeNo, $productId, $product['coins'], $product['price'], json_encode(['coins' => $product['coins']])]
        );

        // 构建 signData
        $offerId = getPayConfig('offer_id');
        $signDataArr = [
            'offerId' => $offerId,
            'buyQuantity' => 1,
            'env' => 0,
            'currencyType' => 'CNY',
            'productId' => $productId,
            'goodsPrice' => $product['price'],
            'outTradeNo' => $outTradeNo,
            'attach' => json_encode(['coins' => $product['coins']])
        ];
        $signData = json_encode($signDataArr);

        // 计算 paySig
        $appKey = getPayConfig('app_key');
        $paySig = calcPaySig('requestVirtualPayment', $signData, $appKey);

        // 计算用户态 signature（如果有session_key）
        $signature = '';
        if (!empty($sessionKeyValue)) {
            $signature = calcSignature($signData, $sessionKeyValue);
        }

        Core\Response::success('下单成功', [
            'payData' => [
                'signData' => $signData,
                'mode' => 'short_series_goods',
                'paySig' => $paySig,
                'signature' => $signature
            ],
            'outTradeNo' => $outTradeNo
        ]);
        break;

    // ========== 保存 session_key（登录时调用） ==========
    case 'save_session_key':
        $userData = Core\Auth::requireAuth();
        $openid = $_POST['openid'] ?? '';
        $sessionKey = $_POST['session_key'] ?? '';

        if (empty($openid) || empty($sessionKey)) {
            Core\Response::error('参数不完整');
            break;
        }

        // 保存或更新 session_key
        $db->execute(
            "INSERT INTO pay_config (config_key, config_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)",
            ["session_key_{$openid}", $sessionKey, "用户{$openid}的session_key"]
        );

        Core\Response::success('保存成功');
        break;

    // ========== 刷新 session_key（支付前调用） ==========
    case 'refresh_session':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];
        $code = $_POST['code'] ?? '';
        if (empty($code)) { Core\Response::error('缺少code'); break; }

        $appid = getPayConfig('app_id');
        $secretRow = $db->query("SELECT app_secret FROM miniapp_config WHERE appid = ? AND enabled = 1 LIMIT 1", [$appid]);
        $secret = $secretRow[0]['app_secret'] ?? '';
        if (empty($secret)) {
            $sr = $db->query("SELECT config_value FROM site_config WHERE config_key = 'wechat_secret' LIMIT 1");
            $secret = $sr[0]['config_value'] ?? '';
        }
        if (empty($appid) || empty($secret)) { Core\Response::error('小程序配置缺失'); break; }

        $url = "https://api.weixin.qq.com/sns/jscode2session?appid={$appid}&secret={$secret}&js_code={$code}&grant_type=authorization_code";
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 10]);
        $resp = curl_exec($ch);
        curl_close($ch);
        $wxData = json_decode($resp, true);
        $sk = $wxData['session_key'] ?? '';
        $oid = $wxData['openid'] ?? '';

        if (!empty($sk) && !empty($oid)) {
            $db->execute("INSERT INTO pay_config (config_key, config_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)", ["session_key_{$oid}", $sk, "wx session_key"]);
            Core\Response::success('刷新成功');
        } else {
            Core\Response::error('刷新失败: ' . ($wxData['errmsg'] ?? 'unknown'));
        }
        break;

    // ========== 接收发货推送（微信回调） ==========
    case 'notify':
        // 覆盖JSON Content-Type为XML
        header('Content-Type: text/xml; charset=utf-8');
        // 读取原始请求体
        $rawBody = file_get_contents('php://input');

        // 解析XML
        $xml = @simplexml_load_string($rawBody, 'SimpleXMLElement', LIBXML_NOCDATA);
        if (!$xml) {
            echo '<xml><ErrCode>1</ErrCode><ErrMsg><![CDATA[invalid xml]]></ErrMsg></xml>';
            exit;
        }

        // 提取关键字段
        $event = (string)($xml->Event ?? '');
        $openid = (string)($xml->OpenId ?? '');
        $outTradeNo = (string)($xml->OutTradeNo ?? '');
        $wxOrderId = (string)($xml->WeChatPayInfo->MchOrderNo ?? '');
        $productId = (string)($xml->GoodsInfo->ProductId ?? '');
        $quantity = (int)($xml->GoodsInfo->Quantity ?? 1);

        if ($event !== 'xpay_goods_deliver_notify') {
            echo '<xml><ErrCode>0</ErrCode><ErrMsg><![CDATA[success]]></ErrMsg></xml>';
            exit;
        }

        // 幂等检查：如果该订单已发货则直接返回成功
        $order = $db->query("SELECT * FROM pay_orders WHERE out_trade_no = ? LIMIT 1", [$outTradeNo]);
        if (empty($order)) {
            // 尝试用 wx_order_id 查
            $order = $db->query("SELECT * FROM pay_orders WHERE wx_order_id = ? LIMIT 1", [$wxOrderId]);
        }

        if (!empty($order) && $order[0]['status'] >= 2) {
            // 已发货，直接返回成功
            echo '<xml><ErrCode>0</ErrCode><ErrMsg><![CDATA[success]]></ErrMsg></xml>';
            exit;
        }

        // 验签（可选但推荐）
        $appKey = getPayConfig('app_key');
        // TODO: 完善签名验证逻辑

        // 开始发货
        try {
            $db->execute("BEGIN");

            if (!empty($order)) {
                $orderRow = $order[0];
                $coins = $orderRow['coins'];
                $userId = $orderRow['user_id'];
                $orderOutTradeNo = $orderRow['out_trade_no'];

                // 更新订单状态
                $db->execute(
                    "UPDATE pay_orders SET status = 2, wx_order_id = ?, deliver_time = NOW() WHERE id = ?",
                    [$wxOrderId, $orderRow['id']]
                );
            } else {
                // 订单不存在（理论上不应该发生），按推送信息发货
                // 从attach中获取coins
                $attachStr = (string)($xml->Attach ?? '');
                $attach = json_decode($attachStr, true);
                $coins = $attach['coins'] ?? 10;

                // 查找用户
                $userRow = $db->query("SELECT id FROM users WHERE openid = ? LIMIT 1", [$openid]);
                if (empty($userRow)) {
                    $db->execute("ROLLBACK");
                    echo '<xml><ErrCode>1</ErrCode><ErrMsg><![CDATA[user not found]]></ErrMsg></xml>';
                    exit;
                }
                $userId = $userRow[0]['id'];
                $orderOutTradeNo = $outTradeNo;

                // 创建订单记录
                $db->execute(
                    "INSERT INTO pay_orders (user_id, openid, out_trade_no, wx_order_id, product_id, coins, amount, status, deliver_time, attach) VALUES (?, ?, ?, ?, ?, ?, 0, 2, NOW(), ?)",
                    [$userId, $openid, $outTradeNo, $wxOrderId, $productId, $coins, $attachStr]
                );
            }

            // 给用户增加代币
            $db->execute(
                "INSERT INTO user_coins (user_id, balance, total_recharged) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?, total_recharged = total_recharged + ?",
                [$userId, $coins, $coins, $coins, $coins]
            );

            // 获取更新后的余额
            $balanceRow = $db->query("SELECT balance FROM user_coins WHERE user_id = ?", [$userId]);
            $newBalance = $balanceRow[0]['balance'] ?? 0;

            // 记录交易流水
            $db->execute(
                "INSERT INTO coin_transactions (user_id, type, amount, balance_after, description, related_order) VALUES (?, 'recharge', ?, ?, ?, ?)",
                [$userId, $coins, $newBalance, "充值{$coins}代币", $orderOutTradeNo]
            );

            $db->execute("COMMIT");

            echo '<xml><ErrCode>0</ErrCode><ErrMsg><![CDATA[success]]></ErrMsg></xml>';
        } catch (Exception $e) {
            $db->execute("ROLLBACK");
            echo '<xml><ErrCode>1</ErrCode><ErrMsg><![CDATA[server error]]></ErrMsg></xml>';
        }
        exit;

    // ========== 查询订单（兜底发货） ==========
    case 'query_order':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];
        $outTradeNo = $_POST['out_trade_no'] ?? $_GET['out_trade_no'] ?? '';

        if (empty($outTradeNo)) {
            Core\Response::error('请提供订单号');
            break;
        }

        // 查本地订单
        $order = $db->query("SELECT * FROM pay_orders WHERE out_trade_no = ? AND user_id = ?", [$outTradeNo, $userId]);
        if (empty($order)) {
            Core\Response::error('订单不存在');
            break;
        }

        $orderRow = $order[0];

        // 如果本地未发货，调用微信query_order查单
        if ($orderRow['status'] < 2) {
            $openid = $orderRow['openid'];
            $appKey = getPayConfig('app_key');

            $postBody = json_encode([
                'openid' => $openid,
                'env' => 0,
                'order_id' => $outTradeNo
            ]);

            $paySig = calcPaySig('/xpay/query_order', $postBody, $appKey);

            $ch = curl_init('https://api.weixin.qq.com/xpay/query_order');
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $postBody,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_TIMEOUT => 10
            ]);
            $response = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($response, true);

            if (isset($result['errcode']) && $result['errcode'] === 0) {
                // 已支付，补发货
                $wxOrderId = $result['order_id'] ?? '';

                $db->execute("BEGIN");
                try {
                    $db->execute(
                        "UPDATE pay_orders SET status = 2, wx_order_id = ?, deliver_time = NOW() WHERE id = ? AND status < 2",
                        [$wxOrderId, $orderRow['id']]
                    );

                    $db->execute(
                        "INSERT INTO user_coins (user_id, balance, total_recharged) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?, total_recharged = total_recharged + ?",
                        [$userId, $orderRow['coins'], $orderRow['coins'], $orderRow['coins'], $orderRow['coins']]
                    );

                    $balanceRow = $db->query("SELECT balance FROM user_coins WHERE user_id = ?", [$userId]);
                    $newBalance = $balanceRow[0]['balance'] ?? 0;

                    $db->execute(
                        "INSERT INTO coin_transactions (user_id, type, amount, balance_after, description, related_order) VALUES (?, 'recharge', ?, ?, ?, ?)",
                        [$userId, $orderRow['coins'], $newBalance, "充值{$orderRow['coins']}代币(补发)", $outTradeNo]
                    );

                    $db->execute("COMMIT");
                } catch (Exception $e) {
                    $db->execute("ROLLBACK");
                }
            }
        }

        // 重新查询订单状态
        $order = $db->query("SELECT * FROM pay_orders WHERE out_trade_no = ?", [$outTradeNo]);
        Core\Response::success('查询成功', [
            'status' => (int)$order[0]['status'],
            'coins' => (int)$order[0]['coins']
        ]);
        break;

    // ========== 消费代币（内部调用） ==========
    case 'consume':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];
        $amount = max(1, (int)($_POST['amount'] ?? 1));
        $description = $_POST['description'] ?? 'AI问诊消费';

        // 检查余额
        $row = $db->query("SELECT balance FROM user_coins WHERE user_id = ?", [$userId]);
        $balance = $row[0]['balance'] ?? 0;

        if ($balance < $amount) {
            Core\Response::error('代币余额不足，请充值', 0, ['balance' => (int)$balance]);
            break;
        }

        // 扣减代币
        $db->execute("UPDATE user_coins SET balance = balance - ?, total_consumed = total_consumed + ? WHERE user_id = ?", [$amount, $amount, $userId]);

        $newBalance = $balance - $amount;

        // 记录流水
        $db->execute(
            "INSERT INTO coin_transactions (user_id, type, amount, balance_after, description) VALUES (?, 'consume', ?, ?, ?)",
            [$userId, -$amount, $newBalance, $description]
        );

        Core\Response::success('消费成功', [
            'consumed' => $amount,
            'balance' => (int)$newBalance
        ]);
        break;

    // ========== 删除待支付订单 ==========
    case 'delete_order':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];
        $outTradeNo = $_POST['out_trade_no'] ?? '';

        if (empty($outTradeNo)) {
            Core\Response::error('缺少订单号');
            break;
        }

        // 只允许删除自己的待支付订单
        $deleted = $db->execute(
            "DELETE FROM pay_orders WHERE out_trade_no = ? AND user_id = ? AND status = 0",
            [$outTradeNo, $userId]
        );

        if ($deleted) {
            Core\Response::success('订单已取消');
        } else {
            Core\Response::error('订单不存在或无法取消');
        }
        break;

    // ========== 清理所有待支付订单（用户主动清理） ==========
    case 'clean_pending':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];

        $db->execute("DELETE FROM pay_orders WHERE user_id = ? AND status = 0", [$userId]);
        Core\Response::success('已清理');
        break;

    // ========== 使用免费次数 ==========
    case 'use_free':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];
        $today = date('Y-m-d');

        // 检查今日免费次数
        $freeRow = $db->query("SELECT used_count FROM daily_free_usage WHERE user_id = ? AND usage_date = ?", [$userId, $today]);
        $freeUsed = $freeRow[0]['used_count'] ?? 0;

        if ($freeUsed >= 1) {
            Core\Response::error('今日免费次数已用完', 0, ['free_remaining' => 0]);
            break;
        }

        // 记录使用
        if (empty($freeRow)) {
            $db->execute("INSERT INTO daily_free_usage (user_id, usage_date, used_count) VALUES (?, ?, 1)", [$userId, $today]);
        } else {
            $db->execute("UPDATE daily_free_usage SET used_count = used_count + 1 WHERE user_id = ? AND usage_date = ?", [$userId, $today]);
        }

        Core\Response::success('使用成功', [
            'free_remaining' => 0,
            'free_used' => $freeUsed + 1
        ]);
        break;

    // ========== 交易记录 ==========
    case 'transactions':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(50, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $list = $db->query(
            "SELECT id, type, amount, balance_after, description, create_time FROM coin_transactions WHERE user_id = ? ORDER BY create_time DESC LIMIT {$offset}, {$limit}",
            [$userId]
        );
        $total = $db->query("SELECT COUNT(*) as cnt FROM coin_transactions WHERE user_id = ?", [$userId]);

        Core\Response::success('获取成功', [
            'list' => $list,
            'total' => (int)($total[0]['cnt'] ?? 0),
            'page' => $page,
            'limit' => $limit
        ]);
        break;

    // ========== 每日签到 ==========
    case 'sign_in':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];
        $today = date('Y-m-d');

        // 检查签到功能是否开启
        $signEnabled = getPayConfig('sign_in_enabled');
        if ($signEnabled !== '1') {
            Core\Response::error('签到功能暂未开放');
            break;
        }

        // 检查今日是否已签到
        $existing = $db->query("SELECT id FROM sign_in_records WHERE user_id = ? AND sign_date = ?", [$userId, $today]);
        if (!empty($existing)) {
            Core\Response::error('今日已签到，请明天再来', 0, ['already_signed' => true]);
            break;
        }

        // 计算连续签到天数
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $prevRecord = $db->query("SELECT streak FROM sign_in_records WHERE user_id = ? AND sign_date = ?", [$userId, $yesterday]);
        $streak = !empty($prevRecord) ? ($prevRecord[0]['streak'] + 1) : 1;

        // 获取签到奖励代币数
        $coinsStr = getPayConfig('sign_in_coins');
        $coins = max(1, (int)($coinsStr ?: 3));

        try {
            $db->execute("BEGIN");

            // 记录签到
            $db->execute(
                "INSERT INTO sign_in_records (user_id, sign_date, coins, streak) VALUES (?, ?, ?, ?)",
                [$userId, $today, $coins, $streak]
            );

            // 增加代币余额
            $db->execute(
                "INSERT INTO user_coins (user_id, balance, total_recharged) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?, total_recharged = total_recharged + ?",
                [$userId, $coins, $coins, $coins, $coins]
            );

            // 获取更新后的余额
            $balanceRow = $db->query("SELECT balance FROM user_coins WHERE user_id = ?", [$userId]);
            $newBalance = $balanceRow[0]['balance'] ?? 0;

            // 记录交易流水
            $db->execute(
                "INSERT INTO coin_transactions (user_id, type, amount, balance_after, description) VALUES (?, 'recharge', ?, ?, ?)",
                [$userId, $coins, $newBalance, "每日签到奖励"]
            );

            $db->execute("COMMIT");

            Core\Response::success('签到成功', [
                'coins' => $coins,
                'streak' => $streak,
                'balance' => (int)$newBalance
            ]);
        } catch (Exception $e) {
            $db->execute("ROLLBACK");
            Core\Response::error('签到失败，请重试');
        }
        break;

    // ========== 签到状态查询 ==========
    case 'sign_status':
        $userData = Core\Auth::requireAuth();
        $userId = $userData['user_id'];
        $today = date('Y-m-d');

        // 今日是否已签到
        $todayRecord = $db->query("SELECT id, coins, streak FROM sign_in_records WHERE user_id = ? AND sign_date = ?", [$userId, $today]);
        $isSigned = !empty($todayRecord);

        // 当前连续签到天数
        $streak = 0;
        if ($isSigned) {
            $streak = (int)($todayRecord[0]['streak'] ?? 0);
        } else {
            // 查昨天的连续天数来预览
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            $prevRecord = $db->query("SELECT streak FROM sign_in_records WHERE user_id = ? AND sign_date = ?", [$userId, $yesterday]);
            $streak = !empty($prevRecord) ? ($prevRecord[0]['streak'] + 1) : 1;
        }

        // 近7天签到记录
        $weekAgo = date('Y-m-d', strtotime('-6 days'));
        $weekRecords = $db->query(
            "SELECT sign_date, coins FROM sign_in_records WHERE user_id = ? AND sign_date >= ? ORDER BY sign_date",
            [$userId, $weekAgo]
        );
        $weekDays = [];
        $signedDates = [];
        foreach ($weekRecords as $r) {
            $signedDates[] = $r['sign_date'];
        }
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-{$i} days"));
            $weekDays[] = [
                'date' => $d,
                'day' => date('D', strtotime($d)),
                'signed' => in_array($d, $signedDates)
            ];
        }

        $coinsStr = getPayConfig('sign_in_coins');
        $coins = (int)($coinsStr ?: 3);

        Core\Response::success('获取成功', [
            'is_signed' => $isSigned,
            'streak' => $streak,
            'coins_per_day' => $coins,
            'week_days' => $weekDays
        ]);
        break;

    default:
        Core\Response::error('未知操作');
        break;
}
