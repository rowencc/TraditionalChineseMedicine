<?php
/**
 * 用户代币管理 API
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../vendor/autoload.php';

$config = require __DIR__ . '/../core/config.php';
Core\Auth::init($config['jwt']['secret'], $config['jwt']['expire']);
$userData = Core\Auth::requireAuth();
if ($userData['role'] !== 'admin') { Core\Response::error('需要管理员权限'); exit; }

$action = $_GET['action'] ?? '';
$db = Core\Database::getInstance();

switch ($action) {
    case 'list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 30)));
        $offset = ($page - 1) * $limit;

        $rows = $db->query(
            "SELECT c.*, u.nickname, u.username, u.openid FROM user_coins c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.balance DESC LIMIT {$offset}, {$limit}"
        );
        $total = $db->query("SELECT COUNT(*) as cnt FROM user_coins");

        Core\Response::success('获取成功', [
            'list' => $rows,
            'total' => (int)($total[0]['cnt'] ?? 0)
        ]);
        break;

    case 'stats':
        $totalUsers = $db->query("SELECT COUNT(*) as cnt FROM user_coins")[0]['cnt'] ?? 0;
        $totalBalance = $db->query("SELECT COALESCE(SUM(balance), 0) as total FROM user_coins")[0]['total'] ?? 0;
        $totalRecharged = $db->query("SELECT COALESCE(SUM(total_recharged), 0) as total FROM user_coins")[0]['total'] ?? 0;
        $totalConsumed = $db->query("SELECT COALESCE(SUM(total_consumed), 0) as total FROM user_coins")[0]['total'] ?? 0;

        Core\Response::success('获取成功', [
            'total_users' => (int)$totalUsers,
            'total_balance' => (int)$totalBalance,
            'total_recharged' => (int)$totalRecharged,
            'total_consumed' => (int)$totalConsumed
        ]);
        break;

    case 'adjust':
        $userId = (int)($_POST['user_id'] ?? 0);
        $amount = (int)($_POST['amount'] ?? 0);
        $reason = $_POST['reason'] ?? '管理员调整';

        if (!$userId || !$amount) {
            Core\Response::error('参数错误');
            break;
        }

        $db->execute(
            "INSERT INTO user_coins (user_id, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = balance + ?",
            [$userId, max(0, $amount), $amount]
        );

        $balanceRow = $db->query("SELECT balance FROM user_coins WHERE user_id = ?", [$userId]);
        $newBalance = $balanceRow[0]['balance'] ?? 0;

        $db->execute(
            "INSERT INTO coin_transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)",
            [$userId, $amount > 0 ? 'recharge' : 'consume', $amount, $newBalance, $reason]
        );

        Core\Response::success('调整成功', ['new_balance' => (int)$newBalance]);
        break;

    case 'sign_stats':
        $today = date('Y-m-d');
        $todaySigns = $db->query("SELECT COUNT(*) as cnt FROM sign_in_records WHERE sign_date = ?", [$today])[0]['cnt'] ?? 0;
        $totalSigns = $db->query("SELECT COUNT(*) as cnt FROM sign_in_records")[0]['cnt'] ?? 0;
        $totalCoinsGiven = $db->query("SELECT COALESCE(SUM(coins), 0) as total FROM sign_in_records")[0]['total'] ?? 0;

        Core\Response::success('获取成功', [
            'today_signs' => (int)$todaySigns,
            'total_signs' => (int)$totalSigns,
            'total_coins_given' => (int)$totalCoinsGiven
        ]);
        break;

    default:
        Core\Response::error('未知操作');
}
