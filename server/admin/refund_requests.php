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
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        $status = $_GET['status'] ?? '';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $where = '1=1';
        $params = [];
        if ($status !== '') { $where .= ' AND r.status = ?'; $params[] = (int)$status; }
        $rows = $db->query(
            "SELECT r.*, u.nickname, u.username, p.product_id FROM refund_requests r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN pay_orders p ON r.order_id = p.id WHERE {$where} ORDER BY r.create_time DESC LIMIT {$offset}, {$limit}",
            $params
        );
        $total = $db->query("SELECT COUNT(*) as cnt FROM refund_requests r WHERE {$where}", $params);
        echo json_encode(['code' => 1, 'data' => ['list' => $rows, 'total' => (int)($total[0]['cnt'] ?? 0), 'page' => $page, 'limit' => $limit]]);
        break;

    case 'stats':
        $total = $db->query('SELECT COUNT(*) as cnt FROM refund_requests')[0]['cnt'] ?? 0;
        $pending = $db->query('SELECT COUNT(*) as cnt FROM refund_requests WHERE status = 0')[0]['cnt'] ?? 0;
        $approved = $db->query('SELECT COUNT(*) as cnt FROM refund_requests WHERE status = 1')[0]['cnt'] ?? 0;
        $rejected = $db->query('SELECT COUNT(*) as cnt FROM refund_requests WHERE status = 2')[0]['cnt'] ?? 0;
        echo json_encode(['code' => 1, 'data' => ['total' => (int)$total, 'pending' => (int)$pending, 'approved' => (int)$approved, 'rejected' => (int)$rejected]]);
        break;

    case 'approve':
        $reqId = (int)($_POST['request_id'] ?? 0);
        $adminNote = trim($_POST['admin_note'] ?? '');
        if (!$reqId) { echo json_encode(['code' => 0, 'msg' => '缺少申请ID']); break; }

        $req = $db->query('SELECT * FROM refund_requests WHERE id = ?', [$reqId]);
        if (empty($req)) { echo json_encode(['code' => 0, 'msg' => '申请不存在']); break; }
        $reqRow = $req[0];
        if ((int)$reqRow['status'] !== 0) { echo json_encode(['code' => 0, 'msg' => '该申请已处理']); break; }

        $userId = (int)$reqRow['user_id'];
        $coins = (int)$reqRow['coins'];
        $orderId = (int)$reqRow['order_id'];

        // 再次检查余额
        $balanceRow = $db->query('SELECT balance FROM user_coins WHERE user_id = ?', [$userId]);
        $balance = (int)($balanceRow[0]['balance'] ?? 0);
        if ($balance < $coins) {
            echo json_encode(['code' => 0, 'msg' => '用户余额不足，无法扣回。余额: ' . $balance . '，需扣: ' . $coins]);
            break;
        }

        try {
            $db->execute('BEGIN');

            // 更新退款申请状态
            $db->execute('UPDATE refund_requests SET status = 1, admin_note = ? WHERE id = ?', [$adminNote ?: '审核通过', $reqId]);

            // 更新订单状态为已退款
            $db->execute('UPDATE pay_orders SET status = 3 WHERE id = ?', [$orderId]);

            // 扣减用户古币
            $db->execute('UPDATE user_coins SET balance = GREATEST(0, balance - ?), total_consumed = total_consumed + ? WHERE user_id = ?', [$coins, $coins, $userId]);

            $newBalRow = $db->query('SELECT balance FROM user_coins WHERE user_id = ?', [$userId]);
            $newBalance = (int)($newBalRow[0]['balance'] ?? 0);

            // 记录流水
            $db->execute(
                'INSERT INTO coin_transactions (user_id, type, amount, balance_after, description, related_order) VALUES (?, ?, ?, ?, ?, ?)',
                [$userId, 'refund', -$coins, $newBalance, '退款审批通过，扣回' . $coins . '古币', $reqRow['out_trade_no']]
            );

            $db->execute('COMMIT');
            echo json_encode(['code' => 1, 'msg' => '审批通过，已扣回' . $coins . '古币', 'data' => ['new_balance' => $newBalance]]);
        } catch (Exception $e) {
            $db->execute('ROLLBACK');
            echo json_encode(['code' => 0, 'msg' => '操作失败: ' . $e->getMessage()]);
        }
        break;

    case 'reject':
        $reqId = (int)($_POST['request_id'] ?? 0);
        $adminNote = trim($_POST['admin_note'] ?? '审核不通过');
        if (!$reqId) { echo json_encode(['code' => 0, 'msg' => '缺少申请ID']); break; }

        $req = $db->query('SELECT status FROM refund_requests WHERE id = ?', [$reqId]);
        if (empty($req)) { echo json_encode(['code' => 0, 'msg' => '申请不存在']); break; }
        if ((int)$req[0]['status'] !== 0) { echo json_encode(['code' => 0, 'msg' => '该申请已处理']); break; }

        $db->execute('UPDATE refund_requests SET status = 2, admin_note = ? WHERE id = ?', [$adminNote, $reqId]);
        echo json_encode(['code' => 1, 'msg' => '已拒绝']);
        break;

    default:
        echo json_encode(['code' => 0, 'msg' => '未知操作']);
}
