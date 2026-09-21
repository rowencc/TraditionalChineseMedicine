<?php
/**
 * 穴位数据管理 API
 * 端点: index.php?module=tcm_admin&action=<action>
 * 需要管理员权限 (role='admin')
 */

require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/Auth.php';
$config = require __DIR__ . '/../core/config.php';
Core\Auth::init($config['jwt']['secret'], $config['jwt']['expire']);
header('Content-Type: application/json; charset=utf-8');

$token = Core\Auth::getTokenFromHeader();
$userData = $token ? Core\Auth::verifyToken($token) : null;
if (!$userData) { echo json_encode(['code'=>0,'msg'=>'请先登录']); exit; }
if (($userData['role'] ?? '') !== 'admin') { echo json_encode(['code'=>0,'msg'=>'需要管理员权限']); exit; }

$db = Core\Database::getInstance();
$action = $_GET['action'] ?? 'list';

// 表字段（排除 id/create_time/update_time/status）
$allowed = ['name','meridian','position','indication','combination','anatomy',
    'image_url','function','classification','classical','contraindications'];

// 从 JSON body 读取输入
function readInput() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? $_POST;
}

// 构造 SET 子句
function buildSet($item, $skipKeys = ['id','name']) {
    $setClauses = [];
    $params = [];
    $insertCols = [];
    $insertParams = [];
    foreach ($allowed as $col) {
        if (isset($item[$col]) && !in_array($col, $skipKeys)) {
            $setClauses[] = "$col = ?";
            $params[] = $item[$col];
            $insertCols[] = $col;
            $insertParams[] = $item[$col];
        }
    }
    return [$setClauses, $params, $insertCols, $insertParams];
}

// 执行 INSERT ON DUPLICATE KEY UPDATE，返回 1=插入 2=更新
function upsertRow($db, $cols, $vals) {
    $ph = implode(',', array_fill(0, count($cols), '?'));
    $updateCols = array_diff($cols, ['name']);
    $updateClauses = array_map(fn($c) => "$c = VALUES($c)", $updateCols);
    $sql = "INSERT INTO tcm_acupoint (" . implode(',', $cols) . ") VALUES ($ph)
            ON DUPLICATE KEY UPDATE " . implode(', ', $updateClauses) . ", update_time = NOW()";
    $stmt = $db->pdo; // Can't access private, use execute
    $db->execute($sql, $vals);
    // Re-query to check if it was insert or update
    return $vals[0]; // name
}

// JSON 编码：数组/对象 → JSON string，字符串 → 原样
function toText($val) {
    if (is_array($val) || is_object($val)) return json_encode($val, JSON_UNESCAPED_UNICODE);
    return $val;
}

switch ($action) {

    case 'columns':
        $cols = $db->query("SHOW COLUMNS FROM tcm_acupoint");
        $names = array_column($cols, 'Field');
        echo json_encode(['code'=>1,'data'=>$names]);
        break;

    case 'stats':
        $total = $db->query("SELECT COUNT(*) as cnt FROM tcm_acupoint");
        $meridians = $db->query("SELECT meridian, COUNT(*) as cnt FROM tcm_acupoint GROUP BY meridian");
        $fieldStats = [];
        foreach ($allowed as $f) {
            $row = $db->query("SELECT COUNT(*) as cnt FROM tcm_acupoint WHERE $f IS NOT NULL AND $f != ''");
            $fieldStats[$f] = (int)($row[0]['cnt'] ?? 0);
        }
        echo json_encode(['code'=>1,'data'=>['total'=>(int)($total[0]['cnt']??0),'meridians'=>$meridians,'field_coverage'=>$fieldStats]]);
        break;

    case 'list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(500, max(1, (int)($_GET['limit'] ?? 50)));
        $meridian = trim($_GET['meridian'] ?? '');
        $keyword = trim($_GET['keyword'] ?? '');
        $offset = ($page - 1) * $limit;
        $where = '1=1'; $params = [];
        if ($meridian) { $where .= " AND meridian = ?"; $params[] = $meridian; }
        if ($keyword) { $where .= " AND (name LIKE ? OR position LIKE ? OR indication LIKE ?)"; $kw='%'.$keyword.'%'; $params[]=$kw; $params[]=$kw; $params[]=$kw; }
        $total = $db->query("SELECT COUNT(*) as cnt FROM tcm_acupoint WHERE $where", $params);
        $rows = $db->query("SELECT * FROM tcm_acupoint WHERE $where ORDER BY meridian, id LIMIT ? OFFSET ?", array_merge($params, [$limit, $offset]));
        echo json_encode(['code'=>1,'data'=>['total'=>(int)($total[0]['cnt']??0),'list'=>$rows]]);
        break;

    case 'detail':
        $id = (int)($_GET['id'] ?? 0);
        $name = trim($_GET['name'] ?? '');
        if ($id) { $rows = $db->query("SELECT * FROM tcm_acupoint WHERE id = ? LIMIT 1", [$id]); }
        elseif ($name) { $rows = $db->query("SELECT * FROM tcm_acupoint WHERE name = ? LIMIT 1", [$name]); }
        else { echo json_encode(['code'=>0,'msg'=>'缺少 id 或 name']); break; }
        echo json_encode(['code'=>1,'data'=>$rows[0] ?? null]);
        break;

    case 'update':
        $input = readInput();
        $id = (int)($input['id'] ?? 0);
        if (!$id) { echo json_encode(['code'=>0,'msg'=>'缺少 id']); break; }
        $setClauses = []; $params = [];
        foreach ($allowed as $col) {
            if (isset($input[$col])) { $setClauses[] = "$col = ?"; $params[] = toText($input[$col]); }
        }
        if (empty($setClauses)) { echo json_encode(['code'=>0,'msg'=>'无有效字段']); break; }
        $params[] = $id;
        $db->execute("UPDATE tcm_acupoint SET " . implode(', ', $setClauses) . ", update_time = NOW() WHERE id = ?", $params);
        echo json_encode(['code'=>1,'msg'=>'已更新','data'=>['id'=>$id]]);
        break;

    case 'batch_update':
        $input = readInput();
        $items = $input['items'] ?? [];
        if (empty($items)) { echo json_encode(['code'=>0,'msg'=>'items 不能为空']); break; }
        $updated = 0; $errors = [];
        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            if (!$name) { $errors[] = '缺少 name'; continue; }
            $setClauses = []; $params = [];
            foreach ($allowed as $col) {
                if (isset($item[$col]) && $col !== 'name') { $setClauses[] = "$col = ?"; $params[] = toText($item[$col]); }
            }
            if (empty($setClauses)) continue;
            $params[] = $name;
            $db->execute("UPDATE tcm_acupoint SET " . implode(', ', $setClauses) . ", update_time = NOW() WHERE name = ?", $params);
            $updated++;
        }
        echo json_encode(['code'=>1,'msg'=>'批量更新完成','data'=>['updated'=>$updated,'errors'=>$errors]]);
        break;

    case 'import_json':
        $input = readInput();
        $items = $input['items'] ?? [];
        if (empty($items)) { echo json_encode(['code'=>0,'msg'=>'items 不能为空']); break; }
        $inserted = 0; $updated = 0; $skipped = 0; $errors = [];
        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            if (!$name) { $errors[] = '缺少 name'; $skipped++; continue; }
            $cols = ['name']; $vals = [$name]; $upCols = [];
            foreach ($allowed as $col) {
                if ($col === 'name') continue;
                if (isset($item[$col])) { $cols[] = $col; $vals[] = toText($item[$col]); $upCols[] = "$col = VALUES($col)"; }
            }
            if (empty($upCols)) { $skipped++; continue; }
            $ph = implode(',', array_fill(0, count($cols), '?'));
            $sql = "INSERT INTO tcm_acupoint (" . implode(',', $cols) . ") VALUES ($ph)
                    ON DUPLICATE KEY UPDATE " . implode(', ', $upCols) . ", update_time = NOW()";
            $db->execute($sql, $vals);
            // 检查是插入还是更新
            $check = $db->query("SELECT id FROM tcm_acupoint WHERE name = ?", [$name]);
            if ($check) $updated++; else $inserted++;
        }
        echo json_encode(['code'=>1,'msg'=>'导入完成','data'=>['inserted'=>$inserted,'updated'=>$updated,'skipped'=>$skipped,'errors'=>$errors]]);
        break;

    case 'import_file':
        $input = readInput();
        $meridians = $input['meridians'] ?? [];
        if (empty($meridians)) { echo json_encode(['code'=>0,'msg'=>'meridians 不能为空']); break; }
        $inserted = 0; $updated = 0; $skipped = 0; $errors = [];
        foreach ($meridians as $mer) {
            $merName = $mer['name'] ?? '';
            if (!$merName) continue;
            foreach ($mer['points'] ?? [] as $point) {
                $name = $point['name'] ?? '';
                if (!$name) { $skipped++; continue; }
                $cols = ['name','meridian']; $vals = [$name, $merName]; $upCols = ['meridian = VALUES(meridian)'];
                foreach ($allowed as $col) {
                    if ($col === 'name' || $col === 'meridian') continue;
                    $jsonKey = $col;
                    if ($col === 'image_url' && isset($point['imageUrl'])) $jsonKey = 'imageUrl';
                    if (isset($point[$jsonKey])) { $cols[] = $col; $vals[] = toText($point[$jsonKey]); $upCols[] = "$col = VALUES($col)"; }
                }
                $ph = implode(',', array_fill(0, count($cols), '?'));
                $sql = "INSERT INTO tcm_acupoint (" . implode(',', $cols) . ") VALUES ($ph)
                        ON DUPLICATE KEY UPDATE " . implode(', ', $upCols) . ", update_time = NOW()";
                $db->execute($sql, $vals);
                $updated++;
            }
        }
        echo json_encode(['code'=>1,'msg'=>'导入完成','data'=>['inserted'=>$inserted,'updated'=>$updated,'skipped'=>$skipped,'errors'=>$errors]]);
        break;

    case 'reset_field':
        $input = readInput();
        $field = trim($input['field'] ?? '');
        if (!$field || !in_array($field, $allowed)) { echo json_encode(['code'=>0,'msg'=>"无效字段: $field"]); break; }
        $db->execute("UPDATE tcm_acupoint SET $field = NULL, update_time = NOW()");
        echo json_encode(['code'=>1,'msg'=>"已清空 $field"]);
        break;

    // ==================== 方剂管理 ====================

    case 'formula_stats':
        $total = $db->query("SELECT COUNT(*) as cnt FROM tcm_formula");
        $fCols = ['classical_quotes','composition_analysis','efficacy','contraindications','modifications'];
        $fStats = [];
        foreach ($fCols as $f) {
            $row = $db->query("SELECT COUNT(*) as cnt FROM tcm_formula WHERE $f IS NOT NULL AND $f != ''");
            $fStats[$f] = (int)($row[0]['cnt'] ?? 0);
        }
        $byMeridian = $db->query("SELECT meridian, COUNT(*) as cnt FROM tcm_formula GROUP BY meridian");
        echo json_encode(['code'=>1,'data'=>['total'=>(int)($total[0]['cnt']??0),'meridians'=>$byMeridian,'field_coverage'=>$fStats]]);
        break;

    case 'formula_import_json':
        $input = readInput();
        $items = $input['items'] ?? [];
        if (empty($items)) { echo json_encode(['code'=>0,'msg'=>'items 不能为空']); break; }
        $fAllowed = ['name','meridian','composition','dosage','symptoms','formula_usage','source',
            'classical_quotes','composition_analysis','efficacy','contraindications','modifications'];
        // 字段映射：DB column → JSON key
        $fMap = [
            'classical_quotes' => 'classicalQuotes',
            'composition_analysis' => 'compositionAnalysis',
            'contraindications' => 'contraindications',
            'modifications' => 'modifications',
            'efficacy' => 'efficacy',
            'formula_usage' => 'usage'
        ];
        $updated = 0; $errors = [];
        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            if (!$name) { $errors[] = '缺少 name'; continue; }
            $setClauses = []; $params = [];
            foreach ($fAllowed as $col) {
                $jsonKey = $col;
                if (isset($fMap[$col])) $jsonKey = $fMap[$col];
                if (isset($item[$jsonKey])) { $setClauses[] = "$col = ?"; $params[] = toText($item[$jsonKey]); }
            }
            if (empty($setClauses)) continue;
            $params[] = $name;
            $db->execute("UPDATE tcm_formula SET " . implode(', ', $setClauses) . ", update_time = NOW() WHERE name = ?", $params);
            $updated++;
        }
        echo json_encode(['code'=>1,'msg'=>'方剂更新完成','data'=>['updated'=>$updated,'errors'=>$errors]]);
        break;

    case 'formula_import_file':
        $input = readInput();
        $items = $input['items'] ?? $input;
        if (!is_array($items)) { echo json_encode(['code'=>0,'msg'=>'items 不能为空']); break; }
        $fAllowed = ['name','meridian','composition','dosage','symptoms','formula_usage','source',
            'classical_quotes','composition_analysis','efficacy','contraindications','modifications'];
        $fMap = [
            'classical_quotes' => 'classicalQuotes',
            'composition_analysis' => 'compositionAnalysis',
            'contraindications' => 'contraindications',
            'modifications' => 'modifications',
            'efficacy' => 'efficacy',
            'formula_usage' => 'usage'
        ];
        $updated = 0; $errors = [];
        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            if (!$name) { $errors[] = '缺少 name'; continue; }
            $setClauses = []; $params = [];
            foreach ($fAllowed as $col) {
                $jsonKey = $col;
                if (isset($fMap[$col])) $jsonKey = $fMap[$col];
                if (isset($item[$jsonKey])) { $setClauses[] = "$col = ?"; $params[] = toText($item[$jsonKey]); }
            }
            if (empty($setClauses)) continue;
            $params[] = $name;
            $db->execute("UPDATE tcm_formula SET " . implode(', ', $setClauses) . ", update_time = NOW() WHERE name = ?", $params);
            $updated++;
        }
        echo json_encode(['code'=>1,'msg'=>'方剂导入完成','data'=>['updated'=>$updated,'errors'=>$errors]]);
        break;

    default:
        echo json_encode(['code'=>0,'msg'=>"未知操作: $action"]);
}
