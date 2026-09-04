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
if (!$userData) { echo json_encode(['code' => 0, 'msg' => '请先登录']); exit; }

$db = Core\Database::getInstance();
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'stats':
        $adminCount = $db->query("SELECT COUNT(*) as cnt FROM users WHERE role='admin'");
        $wxCount = $db->query("SELECT COUNT(*) as cnt FROM users WHERE openid IS NOT NULL AND openid != '' AND role != 'admin'");
        $regularCount = $db->query("SELECT COUNT(*) as cnt FROM users WHERE (openid IS NULL OR openid = '') AND role != 'admin'");
        $allCount = $db->query("SELECT COUNT(*) as cnt FROM users");
        echo json_encode(['code' => 1, 'data' => [
            'admin' => (int)($adminCount[0]['cnt'] ?? 0),
            'wx' => (int)($wxCount[0]['cnt'] ?? 0),
            'regular' => (int)($regularCount[0]['cnt'] ?? 0),
            'total' => (int)($allCount[0]['cnt'] ?? 0),
        ]]);
        break;

    case 'list':
        $role = $_GET['role'] ?? '';
        $keyword = trim($_GET['keyword'] ?? '');
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = '1=1';
        $params = [];

        if ($role === 'admin') {
            $where .= " AND u.role = 'admin'";
        } elseif ($role === 'wx') {
            $where .= " AND u.openid IS NOT NULL AND u.openid != '' AND u.role != 'admin'";
        } elseif ($role === 'regular') {
            $where .= " AND (u.openid IS NULL OR u.openid = '') AND u.role != 'admin'";
        }

        if ($keyword) {
            $where .= " AND (u.username LIKE ? OR u.nickname LIKE ? OR u.id = ?)";
            $kw = "%{$keyword}%";
            $params[] = $kw;
            $params[] = $kw;
            $params[] = (int)$keyword;
        }

        $list = $db->query(
            "SELECT u.id, u.username, u.nickname, u.avatar_url, u.email, u.role, u.openid, u.status, u.last_login, u.create_time,
                    COALESCE(c.balance, 0) as coin_balance, COALESCE(c.total_recharged, 0) as total_recharged, COALESCE(c.total_consumed, 0) as total_consumed
             FROM users u LEFT JOIN user_coins c ON u.id = c.user_id
             WHERE {$where} ORDER BY u.id DESC LIMIT {$offset}, {$limit}", $params);
        $total = $db->query("SELECT COUNT(*) as cnt FROM users u WHERE {$where}", $params);

        foreach ($list as &$u) {
            if (!empty($u['openid'])) {
                $u['openid_display'] = substr($u['openid'], 0, 8) . '****';
            }
            unset($u['openid']);
        }

        echo json_encode(['code' => 1, 'data' => [
            'list' => $list,
            'total' => (int)($total[0]['cnt'] ?? 0),
            'page' => $page,
            'limit' => $limit,
        ]]);
        break;

    case 'transactions':
        $userId = (int)($_GET['user_id'] ?? 0);
        if (!$userId) { echo json_encode(['code' => 0, 'msg' => '缺少user_id']); break; }
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $list = $db->query("SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY create_time DESC LIMIT {$offset}, {$limit}", [$userId]);
        $total = $db->query("SELECT COUNT(*) as cnt FROM coin_transactions WHERE user_id = ?", [$userId]);

        echo json_encode(['code' => 1, 'data' => [
            'list' => $list,
            'total' => (int)($total[0]['cnt'] ?? 0),
            'page' => $page,
            'limit' => $limit,
        ]]);
        break;

    case 'toggle_status':
        $userId = (int)($_POST['user_id'] ?? 0);
        $status = (int)($_POST['status'] ?? 1);
        if ($userId && $userId !== 1) {
            $db->execute('UPDATE users SET status=? WHERE id=?', [$status, $userId]);
            echo json_encode(['code' => 1, 'msg' => '操作成功']);
        } else {
            echo json_encode(['code' => 0, 'msg' => '无法操作']);
        }
        break;

    case 'delete':
        $userId = (int)($_POST['user_id'] ?? 0);
        if ($userId && $userId !== 1) {
            $db->execute('DELETE FROM users WHERE id=?', [$userId]);
            echo json_encode(['code' => 1, 'msg' => '删除成功']);
        } else {
            echo json_encode(['code' => 0, 'msg' => '无法删除']);
        }
        break;

    default:
        echo json_encode(['code' => 0, 'msg' => '未知操作']);
}
