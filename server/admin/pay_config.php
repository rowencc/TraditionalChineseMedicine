<?php
/**
 * 支付配置管理 API
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
        $rows = $db->query("SELECT * FROM pay_config ORDER BY id");
        Core\Response::success('获取成功', $rows);
        break;

    case 'save':
        $key = $_POST['config_key'] ?? '';
        $value = $_POST['config_value'] ?? '';
        $desc = $_POST['description'] ?? '';
        if (empty($key)) { Core\Response::error('配置键不能为空'); break; }

        $db->execute(
            "INSERT INTO pay_config (config_key, config_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), description = VALUES(description)",
            [$key, $value, $desc]
        );
        Core\Response::success('保存成功');
        break;

    case 'delete':
        $key = $_POST['config_key'] ?? '';
        if (empty($key)) { Core\Response::error('参数错误'); break; }
        $db->execute("DELETE FROM pay_config WHERE config_key = ?", [$key]);
        Core\Response::success('删除成功');
        break;

    default:
        Core\Response::error('未知操作');
}
