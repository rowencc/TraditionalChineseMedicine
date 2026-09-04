<?php
$root = dirname(dirname(__DIR__));
$config = require $root . '/core/config.php';
require_once $root . '/core/Database.php';
require_once $root . '/core/Auth.php';
Core\Auth::init($config['jwt']['secret'], $config['jwt']['expire']);
header('Content-Type: application/json; charset=utf-8');

$userData = null;
$token = Core\Auth::getTokenFromHeader();
if ($token) { $userData = Core\Auth::verifyToken($token); }
if (!$userData || $userData['role'] !== 'admin') { echo json_encode(['code' => 0, 'msg' => '需要管理员权限']); exit; }

$db = Core\Database::getInstance();

function getAdminWxAccessToken() {
    $db = Core\Database::getInstance();
    $cached = $db->query("SELECT config_value, description FROM pay_config WHERE config_key = 'wx_access_token' LIMIT 1");
    if (!empty($cached[0]['config_value'])) {
        $expireTime = (int)($cached[0]['description'] ?? 0);
        if (time() < $expireTime - 60) return $cached[0]['config_value'];
    }
    $miniapp = $db->query("SELECT appid, app_secret FROM miniapp_config WHERE enabled = 1 ORDER BY id LIMIT 1");
    $appid = $miniapp[0]['appid'] ?? '';
    $secret = $miniapp[0]['app_secret'] ?? '';
    if (empty($appid)) { $r = $db->query("SELECT config_value FROM pay_config WHERE config_key = 'app_id' LIMIT 1"); $appid = $r[0]['config_value'] ?? ''; }
    if (empty($secret)) { $r = $db->query("SELECT config_value FROM site_config WHERE config_key = 'wechat_secret' LIMIT 1"); $secret = $r[0]['config_value'] ?? ''; }
    if (empty($appid) || empty($secret)) return '';
    $ch = curl_init("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={$appid}&secret={$secret}");
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 10]);
    $resp = curl_exec($ch); curl_close($ch);
    $data = json_decode($resp, true);
    $accessToken = $data['access_token'] ?? '';
    if (!empty($accessToken)) {
        $db->execute("INSERT INTO pay_config (config_key, config_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), description = VALUES(description)", ['wx_access_token', $accessToken, (string)(time() + (int)($data['expires_in'] ?? 7200))]);
    }
    return $accessToken;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        $status = $_GET['status'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $where = '1=1';
        $params = [];
        if ($status !== '') { $where .= ' AND o.status = ?'; $params[] = (int)$status; }
        $rows = $db->query("SELECT o.*, u.nickname, u.username FROM pay_orders o LEFT JOIN users u ON o.user_id = u.id WHERE {$where} ORDER BY o.create_time DESC LIMIT {$offset}, {$limit}", $params);
        $total = $db->query("SELECT COUNT(*) as cnt FROM pay_orders o WHERE {$where}", $params);
        echo json_encode(['code' => 1, 'data' => ['list' => $rows, 'total' => (int)($total[0]['cnt'] ?? 0), 'page' => $page, 'limit' => $limit]]);
        break;

    case 'stats':
        $totalOrders = $db->query('SELECT COUNT(*) as cnt FROM pay_orders')[0]['cnt'] ?? 0;
        $paidOrders = $db->query('SELECT COUNT(*) as cnt FROM pay_orders WHERE status >= 2')[0]['cnt'] ?? 0;
        $totalAmount = $db->query('SELECT COALESCE(SUM(amount), 0) as total FROM pay_orders WHERE status >= 2')[0]['total'] ?? 0;
        $totalCoins = $db->query('SELECT COALESCE(SUM(coins), 0) as total FROM pay_orders WHERE status >= 2')[0]['total'] ?? 0;
        $refundedOrders = $db->query('SELECT COUNT(*) as cnt FROM pay_orders WHERE status = 3')[0]['cnt'] ?? 0;
        $refundedAmount = $db->query('SELECT COALESCE(SUM(amount), 0) as total FROM pay_orders WHERE status = 3')[0]['total'] ?? 0;
        echo json_encode(['code' => 1, 'data' => [
            'total_orders' => (int)$totalOrders, 'paid_orders' => (int)$paidOrders,
            'total_amount' => (int)$totalAmount, 'total_coins_sold' => (int)$totalCoins,
            'refunded_orders' => (int)$refundedOrders, 'refunded_amount' => (int)$refundedAmount
        ]]);
        break;

    case 'refund':
        $orderId = (int)($_POST['order_id'] ?? 0);
        $reason = trim($_POST['reason'] ?? '管理员退款');
        if (!$orderId) { echo json_encode(['code' => 0, 'msg' => '缺少订单ID']); break; }

        $order = $db->query('SELECT * FROM pay_orders WHERE id = ?', [$orderId]);
        if (empty($order)) { echo json_encode(['code' => 0, 'msg' => '订单不存在']); break; }
        $orderRow = $order[0];
        if ((int)$orderRow['status'] < 2) { echo json_encode(['code' => 0, 'msg' => '订单未完成，无法退款']); break; }
        if ((int)$orderRow['status'] === 3) { echo json_encode(['code' => 0, 'msg' => '订单已退款']); break; }

        $outTradeNo = $orderRow['out_trade_no'];
        $openid = $orderRow['openid'];
        $refundAmount = (int)$orderRow['amount'];
        $coins = (int)$orderRow['coins'];
        $userId = (int)$orderRow['user_id'];

        // 获取 access_token
        $accessToken = getAdminWxAccessToken();
        if (empty($accessToken)) {
            echo json_encode(['code' => 0, 'msg' => '获取access_token失败，请检查小程序配置']);
            break;
        }

        // 构建请求体和签名
        $appKey = $db->query("SELECT config_value FROM pay_config WHERE config_key = 'app_key' LIMIT 1")[0]['config_value'] ?? '';
        $wxOrderId = $orderRow['wx_order_id'] ?? '';
        $postBody = json_encode([
            'openid' => $openid,
            'order_id' => $outTradeNo,
            'wx_order_id' => $wxOrderId,
            'refund_order_id' => 'R' . $outTradeNo,
            'left_fee' => 0,
            'refund_fee' => $refundAmount,
            'biz_meta' => '',
            'refund_reason' => '5',
            'req_from' => '3',
            'env' => 0
        ]);
        $paySig = hash_hmac('sha256', '/xpay/refund_order&' . $postBody, $appKey);

        $ch = curl_init('https://api.weixin.qq.com/xpay/refund_order?access_token=' . $accessToken . '&pay_sig=' . $paySig);

        $ch = curl_init('https://api.weixin.qq.com/xpay/refund_order?access_token=' . $accessToken . '&pay_sig=' . $paySig);
        curl_setopt_array($ch, [
            CURLOPT_POST => true, CURLOPT_POSTFIELDS => $postBody,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 15
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $result = json_decode($response, true);

        if (isset($result['errcode']) && $result['errcode'] === 0) {
            try {
                $db->execute('BEGIN');
                $db->execute('UPDATE pay_orders SET status = 3 WHERE id = ?', [$orderId]);
                $db->execute('UPDATE user_coins SET balance = GREATEST(0, balance - ?), total_consumed = total_consumed + ? WHERE user_id = ?', [$coins, $coins, $userId]);
                $balanceRow = $db->query('SELECT balance FROM user_coins WHERE user_id = ?', [$userId]);
                $newBalance = $balanceRow[0]['balance'] ?? 0;
                $db->execute('INSERT INTO coin_transactions (user_id, type, amount, balance_after, description, related_order) VALUES (?, ?, ?, ?, ?, ?)', [$userId, 'refund', -$coins, $newBalance, '退款扣回' . $coins . '古币: ' . $reason, $outTradeNo]);
                $db->execute('COMMIT');
                echo json_encode(['code' => 1, 'msg' => '退款成功', 'data' => ['refund_amount' => $refundAmount, 'coins_deducted' => $coins, 'new_balance' => (int)$newBalance]]);
            } catch (Exception $e) {
                $db->execute('ROLLBACK');
                echo json_encode(['code' => 0, 'msg' => '退款成功但扣币失败: ' . $e->getMessage()]);
            }
        } else {
            $errMsg = $result['errmsg'] ?? ($result['errcode'] ?? '未知错误');
            echo json_encode(['code' => 0, 'msg' => '微信退款失败: ' . $errMsg . ' (HTTP ' . $httpCode . ')']);
        }
        break;

    case 'delete':
        $orderId = (int)($_POST['order_id'] ?? 0);
        if (!$orderId) { echo json_encode(['code' => 0, 'msg' => '缺少订单ID']); break; }
        $order = $db->query('SELECT status FROM pay_orders WHERE id = ?', [$orderId]);
        if (empty($order)) { echo json_encode(['code' => 0, 'msg' => '订单不存在']); break; }
        if ((int)$order[0]['status'] !== 0) { echo json_encode(['code' => 0, 'msg' => '只能删除待支付订单']); break; }
        $db->execute('DELETE FROM pay_orders WHERE id = ?', [$orderId]);
        echo json_encode(['code' => 1, 'msg' => '删除成功']);
        break;

    case 'clean_expired':
        $db->execute("DELETE FROM pay_orders WHERE status = 0 AND create_time < DATE_SUB(NOW(), INTERVAL 24 HOUR)");
        echo json_encode(['code' => 1, 'msg' => '已清理过期订单']);
        break;

    default:
        echo json_encode(['code' => 0, 'msg' => '未知操作']);
}
