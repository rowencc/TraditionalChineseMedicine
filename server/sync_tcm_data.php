<?php
/**
 * 知识库同步（CLI 入口）
 *
 * 数据源：data/formulas.json、data/acupoints.json
 * 逻辑见 core/KnowledgeSync.php（与后台「数据更新」按钮共用）
 *
 * 用法：
 *   php sync_tcm_data.php --dry-run      # 预演（事务内执行后回滚）
 *   php sync_tcm_data.php                # 执行并备份数据表
 *   php sync_tcm_data.php --no-backup    # 执行但不备份
 *
 * 仅允许 CLI 执行，避免被公网直接触发。
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("CLI only\n");
}

$argvList = $argv ?? [];
$dry = in_array('--dry-run', $argvList, true);
$noBackup = in_array('--no-backup', $argvList, true);

$config = require __DIR__ . '/../core/config.php';
$d = $config['database'];
$dsn = "mysql:host={$d['host']};dbname={$d['database']};charset={$d['charset']}";

try {
    $pdo = new PDO($dsn, $d['username'], $d['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    fwrite(STDERR, "数据库连接失败: " . $e->getMessage() . "\n");
    exit(1);
}

require_once __DIR__ . '/../core/KnowledgeSync.php';

try {
    $s = Core\KnowledgeSync::run($pdo, [
        'backup' => !$noBackup,
        'dryRun' => $dry,
    ]);
} catch (Exception $e) {
    fwrite(STDERR, $e->getMessage() . "\n");
    exit(1);
}

if ($s['backup'] !== '') {
    echo "已备份: {$s['backup']}\n";
}
echo ($dry ? "[dry-run] " : "") . "方剂: 本地 {$s['formula_json_count']} 条（本层去重 {$s['local_dupes']}）\n";
echo "  新增 {$s['insert']} / 更新 {$s['update']} / 清重复行 {$s['dedupe']}\n";
echo "穴位: 新增 {$s['point_insert']} / 更新 {$s['point_update']}\n";
echo "索引: {$s['index']}\n";
echo "库内: tcm_formula={$s['formula_total']}（唯一 {$s['formula_unique']}）/ tcm_acupoint={$s['point_total']}（唯一 {$s['point_unique']}）\n";
echo "柴胡桂枝干姜汤: " . ($s['has_new_formula'] ? '已收录' : '缺失') . "\n";

if (!$s['consistent']) {
    fwrite(STDERR, "警告: 库内唯一条数与本地不一致（本地 {$s['formula_json_count']} / 库内 {$s['formula_unique']}）\n");
    exit(2);
}

if ($dry) {
    echo "（预演结果已回滚，未写库）\n";
}

exit(0);
