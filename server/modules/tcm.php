<?php
/**
 * 中医知识库模块 - 支持分词模糊搜索
 */
$action = $_GET['action'] ?? '';
$db = Core\Database::getInstance();

/**
 * 构建精准模糊搜索条件
 *
 * 策略：分层匹配 —— 模糊搜索但精准匹配，避免返回大量不相关内容。
 * 1. 完整关键词精确匹配（LIKE '%完整关键词%'）—— 最精准，优先命中
 * 2. 长词分词模糊匹配：关键词 >=4 字时拆成 2 字 n-gram，要求字段命中的
 *    片段数达到门槛（>= max(2, ceil(片段数*0.6))），用 SQL 布尔累加实现。
 *    取代旧方案"所有 2 字片段 OR 连接"——后者任意常见片段即命中，
 *    在长文本字段（如医案 content）上会返回海量无关结果。
 */
function buildFuzzySearchCondition($keyword, $fields) {
    $keyword = trim($keyword);
    if (empty($keyword)) return ['1=1', []];

    $len = mb_strlen($keyword, 'UTF-8');

    // 1. 完整关键词精确匹配（最精准）
    $exactConds = [];
    $exactParams = [];
    foreach ($fields as $field) {
        $exactConds[] = "{$field} LIKE ?";
        $exactParams[] = "%{$keyword}%";
    }

    // 2. 长词分词模糊匹配（命中数门槛）
    $fuzzyConds = [];
    $fuzzyParams = [];
    if ($len >= 4) {
        $segments = [];
        for ($i = 0; $i < $len - 1; $i++) {
            $segments[] = mb_substr($keyword, $i, 2, 'UTF-8');
        }
        $segments = array_values(array_unique($segments));

        // 命中门槛：至少 2 个片段，且覆盖 60% 以上片段数
        $minHits = max(2, (int)ceil(count($segments) * 0.6));

        foreach ($fields as $field) {
            $hitConds = [];
            foreach ($segments as $seg) {
                $hitConds[] = "COALESCE({$field} LIKE ?, 0)";
                $fuzzyParams[] = "%{$seg}%";
            }
            $fuzzyConds[] = '(' . implode(' + ', $hitConds) . " >= {$minHits})";
        }
    }

    $allConds = array_merge($exactConds, $fuzzyConds);
    $allParams = array_merge($exactParams, $fuzzyParams);

    if (empty($allConds)) return ['1=1', []];
    return [implode(' OR ', $allConds), $allParams];
}

switch ($action) {
    // ===== 方剂 =====
    case 'formula_list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $meridian = $_GET['meridian'] ?? '';
        $keyword = $_GET['keyword'] ?? '';

        $where = '1=1';
        $params = [];

        if ($meridian) {
            $where .= ' AND meridian = ?';
            $params[] = $meridian;
        }
        if ($keyword) {
            list($searchCond, $searchParams) = buildFuzzySearchCondition($keyword, ['name', 'composition', 'symptoms', 'formula_usage']);
            $where .= " AND ({$searchCond})";
            $params = array_merge($params, $searchParams);
        }

        $offset = ($page - 1) * $limit;
        $list = $db->query("SELECT * FROM tcm_formula WHERE {$where} ORDER BY id LIMIT {$offset}, {$limit}", $params);
        $count = $db->count('tcm_formula', $where, $params);

        Core\Response::success('获取成功', [
            'list' => $list,
            'count' => $count,
            'page' => $page,
            'limit' => $limit,
        ]);
        break;

    case 'formula_detail':
        $id = (int)($_GET['id'] ?? 0);
        $name = $_GET['name'] ?? '';

        if ($id) {
            $list = $db->query('SELECT * FROM tcm_formula WHERE id = ?', [$id]);
        } elseif ($name) {
            $list = $db->query('SELECT * FROM tcm_formula WHERE name = ?', [$name]);
        } else {
            Core\Response::error('请传入id或name');
            break;
        }

        if (empty($list)) {
            Core\Response::error('方剂不存在');
            break;
        }

        Core\Response::success('获取成功', $list[0]);
        break;

    // ===== 药物 =====
    case 'herb_list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $category = $_GET['category'] ?? '';
        $nature = $_GET['nature'] ?? '';
        $keyword = $_GET['keyword'] ?? '';

        $where = '1=1';
        $params = [];

        if ($category) {
            $where .= ' AND category = ?';
            $params[] = $category;
        }
        if ($nature) {
            $where .= ' AND nature LIKE ?';
            $params[] = "%{$nature}%";
        }
        if ($keyword) {
            list($searchCond, $searchParams) = buildFuzzySearchCondition($keyword, ['name', 'effect', 'herb_usage']);
            $where .= " AND ({$searchCond})";
            $params = array_merge($params, $searchParams);
        }

        $offset = ($page - 1) * $limit;
        $list = $db->query("SELECT * FROM tcm_herb WHERE {$where} ORDER BY id LIMIT {$offset}, {$limit}", $params);
        $count = $db->count('tcm_herb', $where, $params);

        Core\Response::success('获取成功', [
            'list' => $list,
            'count' => $count,
            'page' => $page,
            'limit' => $limit,
        ]);
        break;

    case 'herb_detail':
        $id = (int)($_GET['id'] ?? 0);
        $name = $_GET['name'] ?? '';

        if ($id) {
            $list = $db->query('SELECT * FROM tcm_herb WHERE id = ?', [$id]);
        } elseif ($name) {
            $list = $db->query('SELECT * FROM tcm_herb WHERE name = ?', [$name]);
        } else {
            Core\Response::error('请传入id或name');
            break;
        }

        if (empty($list)) {
            Core\Response::error('药物不存在');
            break;
        }

        Core\Response::success('获取成功', $list[0]);
        break;

    // ===== 穴位 =====
    case 'acupoint_list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));
        $meridian = $_GET['meridian'] ?? '';
        $keyword = $_GET['keyword'] ?? '';

        $where = '1=1';
        $params = [];

        if ($meridian) {
            $where .= ' AND meridian = ?';
            $params[] = $meridian;
        }
        if ($keyword) {
            list($searchCond, $searchParams) = buildFuzzySearchCondition($keyword, ['name', 'indication', 'position']);
            $where .= " AND ({$searchCond})";
            $params = array_merge($params, $searchParams);
        }

        $offset = ($page - 1) * $limit;
        $list = $db->query("SELECT * FROM tcm_acupoint WHERE {$where} ORDER BY id LIMIT {$offset}, {$limit}", $params);
        $count = $db->count('tcm_acupoint', $where, $params);

        Core\Response::success('获取成功', [
            'list' => $list,
            'count' => $count,
            'page' => $page,
            'limit' => $limit,
        ]);
        break;

    case 'acupoint_detail':
        $id = (int)($_GET['id'] ?? 0);
        $name = $_GET['name'] ?? '';

        if ($id) {
            $list = $db->query('SELECT * FROM tcm_acupoint WHERE id = ?', [$id]);
        } elseif ($name) {
            $list = $db->query('SELECT * FROM tcm_acupoint WHERE name = ?', [$name]);
        } else {
            Core\Response::error('请传入id或name');
            break;
        }

        if (empty($list)) {
            Core\Response::error('穴位不存在');
            break;
        }

        Core\Response::success('获取成功', $list[0]);
        break;

    // ===== 医案 =====
    case 'case_list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $category = $_GET['category'] ?? '';
        $keyword = $_GET['keyword'] ?? '';

        $where = '1=1';
        $params = [];

        if ($category) {
            $where .= ' AND category = ?';
            $params[] = $category;
        }
        if ($keyword) {
            list($searchCond, $searchParams) = buildFuzzySearchCondition($keyword, ['disease', 'content']);
            $where .= " AND ({$searchCond})";
            $params = array_merge($params, $searchParams);
        }

        $offset = ($page - 1) * $limit;
        $list = $db->query("SELECT * FROM tcm_case WHERE {$where} ORDER BY id DESC LIMIT {$offset}, {$limit}", $params);
        $count = $db->count('tcm_case', $where, $params);

        Core\Response::success('获取成功', [
            'list' => $list,
            'count' => $count,
            'page' => $page,
            'limit' => $limit,
        ]);
        break;

    case 'case_detail':
        $id = (int)($_GET['id'] ?? 0);

        if (!$id) {
            Core\Response::error('请传入id');
            break;
        }

        $list = $db->query('SELECT * FROM tcm_case WHERE id = ?', [$id]);

        if (empty($list)) {
            Core\Response::error('医案不存在');
            break;
        }

        Core\Response::success('获取成功', $list[0]);
        break;

    // ===== 统计 =====
    case 'stats':
        $stats = [
            'formula_count' => $db->count('tcm_formula'),
            'herb_count' => $db->count('tcm_herb'),
            'acupoint_count' => $db->count('tcm_acupoint'),
            'case_count' => $db->count('tcm_case'),
        ];
        Core\Response::success('获取成功', $stats);
        break;

    // ===== 测试 =====
    case 'test':
        Core\Response::success('TCM API is working!', [
            'time' => date('Y-m-d H:i:s'),
            'version' => '2.0.0-fuzzy-precise'
        ]);
        break;

    default:
        Core\Response::error('未知操作');
        break;
}
