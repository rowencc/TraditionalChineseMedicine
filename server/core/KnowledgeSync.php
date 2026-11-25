<?php
/**
 * 知识库同步核心逻辑（CLI 与后台按钮共用）
 *
 * 数据源：服务端 data/formulas.json、data/acupoints.json
 * 行为：
 *   - 方剂按 name upsert，穴位按 (name, meridian) upsert
 *   - 同名重复行自动清理（保留 id 最小的一行）
 *   - 可选备份数据表，并只保留最近 N 份
 *   - 补充唯一索引 uk_name / uk_point
 *
 * 返回值：统计数组（不直接输出，便于 CLI 与 JSON 接口复用）
 */

namespace Core;

use PDO;
use stdClass;

class KnowledgeSync
{
    const BACKUP_KEEP = 5;

    /**
     * @param PDO   $pdo
     * @param array $opts backup(bool, 默认 true)
     * @return array
     * @throws \Exception
     */
    public static function run(PDO $pdo, array $opts = [])
    {
        $backup = array_key_exists('backup', $opts) ? (bool)$opts['backup'] : true;
        $dryRun = !empty($opts['dryRun']);
        if ($dryRun) {
            $backup = false; // 预演不落盘
        }
        $dataDir = isset($opts['dataDir']) ? $opts['dataDir'] : dirname(__DIR__) . '/data';

        $stats = [
            'insert' => 0,
            'update' => 0,
            'dedupe' => 0,
            'point_insert' => 0,
            'point_update' => 0,
            'local_dupes' => 0,
            'formula_json_count' => 0,
            'formula_total' => 0,
            'formula_unique' => 0,
            'point_total' => 0,
            'point_unique' => 0,
            'has_new_formula' => false,
            'backup' => '',
            'index' => '',
        ];

        if ($backup) {
            $stats['backup'] = self::backup($pdo);
            self::pruneBackups($pdo);
        }

        // ---------- 方剂 ----------
        $formulasRaw = self::readJson($dataDir . '/formulas.json');
        $formulas = [];
        foreach ($formulasRaw as $f) {
            if (!isset($f['name']) || trim((string)$f['name']) === '') {
                continue;
            }
            $formulas[$f['name']] = $f;
        }
        $stats['local_dupes'] = count($formulasRaw) - count($formulas);
        $stats['formula_json_count'] = count($formulas);

        $selFormula = $pdo->prepare("SELECT id FROM tcm_formula WHERE name = ? ORDER BY id");
        $updFormula = $pdo->prepare(
            "UPDATE tcm_formula SET meridian=?, composition=?, dosage=?, symptoms=?, formula_usage=?, source=?,
             classical_quotes=?, composition_analysis=?, efficacy=?, contraindications=?, modifications=?,
             status=1, update_time=NOW() WHERE id=?"
        );
        $insFormula = $pdo->prepare(
            "INSERT INTO tcm_formula
             (name, meridian, composition, dosage, symptoms, formula_usage, source,
              classical_quotes, composition_analysis, efficacy, contraindications, modifications,
              status, create_time, update_time)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,NOW(),NOW())"
        );
        $delFormula = $pdo->prepare("DELETE FROM tcm_formula WHERE id = ?");

        $pdo->beginTransaction();
        foreach ($formulas as $name => $f) {
            $values = [
                (string)($f['meridian'] ?? ''),
                self::jenc($f['composition'] ?? []),
                (string)($f['dosage'] ?? ''),
                self::jenc($f['symptoms'] ?? []),
                (string)($f['usage'] ?? ''),
                (string)($f['source'] ?? ''),
                self::jenc($f['classicalQuotes'] ?? []),
                self::jenc($f['compositionAnalysis'] ?? new stdClass()),
                (string)($f['efficacy'] ?? ''),
                (string)($f['contraindications'] ?? ''),
                self::jenc($f['modifications'] ?? []),
            ];

            $selFormula->execute([$name]);
            $ids = $selFormula->fetchAll(PDO::FETCH_COLUMN);

            if (!$ids) {
                $insFormula->execute(array_merge([$name], $values));
                $stats['insert']++;
                continue;
            }

            $keep = (int)$ids[0];
            $updFormula->execute(array_merge($values, [$keep]));
            foreach (array_slice($ids, 1) as $dupId) {
                $delFormula->execute([(int)$dupId]);
            }
            $stats['update']++;
            $stats['dedupe'] += count($ids) - 1;
        }

        // ---------- 穴位 ----------
        $acupoints = self::readJson($dataDir . '/acupoints.json');
        if (!isset($acupoints['meridians']) || !is_array($acupoints['meridians'])) {
            throw new \Exception('acupoints.json 缺少 meridians');
        }

        $selPoint = $pdo->prepare("SELECT id FROM tcm_acupoint WHERE name = ? AND meridian = ? ORDER BY id");
        $updPoint = $pdo->prepare("UPDATE tcm_acupoint SET position=?, indication=?, combination=? WHERE id=?");
        $insPoint = $pdo->prepare("INSERT INTO tcm_acupoint (name, meridian, position, indication, combination, anatomy) VALUES (?,?,?,?,?,'')");
        $delPoint = $pdo->prepare("DELETE FROM tcm_acupoint WHERE id = ?");

        foreach ($acupoints['meridians'] as $meridian) {
            $meridianName = (string)($meridian['name'] ?? '');
            if ($meridianName === '' || empty($meridian['points'])) {
                continue;
            }
            foreach ($meridian['points'] as $p) {
                $pointName = (string)($p['name'] ?? '');
                if ($pointName === '') {
                    continue;
                }
                $vals = [
                    (string)($p['position'] ?? ''),
                    (string)($p['indication'] ?? ''),
                    self::jenc($p['combination'] ?? []),
                ];

                $selPoint->execute([$pointName, $meridianName]);
                $ids = $selPoint->fetchAll(PDO::FETCH_COLUMN);
                if (!$ids) {
                    $insPoint->execute(array_merge([$pointName, $meridianName], $vals));
                    $stats['point_insert']++;
                } else {
                    $updPoint->execute(array_merge($vals, [(int)$ids[0]]));
                    foreach (array_slice($ids, 1) as $dupId) {
                        $delPoint->execute([(int)$dupId]);
                    }
                    $stats['point_update']++;
                }
            }
        }

        // ---------- 唯一索引 ----------
        if ($dryRun) {
            $stats['index'] = '预演跳过';
        } else {
            $notes = [];
            $chk = $pdo->query("SHOW INDEX FROM tcm_formula WHERE Key_name = 'uk_name'")->fetchAll();
            if (!$chk) {
                $pdo->exec("ALTER TABLE tcm_formula ADD UNIQUE KEY uk_name (name)");
                $notes[] = 'uk_name 已创建';
            } else {
                $notes[] = 'uk_name 已存在';
            }
            $chk2 = $pdo->query("SHOW INDEX FROM tcm_acupoint WHERE Key_name = 'uk_point'")->fetchAll();
            if (!$chk2) {
                $pdo->exec("ALTER TABLE tcm_acupoint ADD UNIQUE KEY uk_point (name, meridian)");
                $notes[] = 'uk_point 已创建';
            } else {
                $notes[] = 'uk_point 已存在';
            }
            $stats['index'] = implode('；', $notes);
        }

        // ---------- 结果 ----------
        $stats['formula_total'] = (int)$pdo->query("SELECT COUNT(*) FROM tcm_formula")->fetchColumn();
        $stats['formula_unique'] = (int)$pdo->query("SELECT COUNT(DISTINCT name) FROM tcm_formula")->fetchColumn();
        $stats['point_total'] = (int)$pdo->query("SELECT COUNT(*) FROM tcm_acupoint")->fetchColumn();
        $stats['point_unique'] = (int)$pdo->query("SELECT COUNT(*) FROM (SELECT name, meridian FROM tcm_acupoint GROUP BY name, meridian) t")->fetchColumn();
        $stats['has_new_formula'] = (bool)$pdo->query("SELECT COUNT(*) FROM tcm_formula WHERE name = '柴胡桂枝干姜汤'")->fetchColumn();

        if ($dryRun) {
            $pdo->rollBack();
        } else {
            $pdo->commit();
        }

        $stats['consistent'] = ($stats['formula_unique'] === $stats['formula_json_count']);
        if (!$dryRun && !$stats['consistent']) {
            throw new \Exception('库内唯一条数与本地不一致（本地 ' . $stats['formula_json_count'] . ' / 库内 ' . $stats['formula_unique'] . '）');
        }

        return $stats;
    }

    /** 表备份：CREATE TABLE ... LIKE + INSERT ... SELECT（兼容 GTID） */
    private static function backup(PDO $pdo)
    {
        $ts = date('Ymd_His');
        $pdo->exec("CREATE TABLE tcm_formula_bak_$ts LIKE tcm_formula");
        $pdo->exec("INSERT INTO tcm_formula_bak_$ts SELECT * FROM tcm_formula");
        $pdo->exec("CREATE TABLE tcm_acupoint_bak_$ts LIKE tcm_acupoint");
        $pdo->exec("INSERT INTO tcm_acupoint_bak_$ts SELECT * FROM tcm_acupoint");
        return "tcm_formula_bak_$ts / tcm_acupoint_bak_$ts";
    }

    /** 只保留最近 BACKUP_KEEP 份备份 */
    private static function pruneBackups(PDO $pdo)
    {
        foreach (['tcm_formula_bak_', 'tcm_acupoint_bak_'] as $prefix) {
            $tables = [];
            foreach ($pdo->query("SHOW TABLES LIKE '{$prefix}%'") as $row) {
                $tables[] = reset($row);
            }
            sort($tables);
            $extra = array_slice($tables, 0, max(0, count($tables) - self::BACKUP_KEEP));
            foreach ($extra as $t) {
                // 表名由本类生成，格式固定，直接拼接安全
                if (preg_match('/^' . $prefix . '\d{8}_\d{6}$/', $t)) {
                    $pdo->exec("DROP TABLE `$t`");
                }
            }
        }
    }

    private static function readJson($path)
    {
        if (!is_file($path)) {
            throw new \Exception('数据文件不存在: ' . $path);
        }
        $data = json_decode(file_get_contents($path), true);
        if (!is_array($data)) {
            throw new \Exception('数据解析失败: ' . $path);
        }
        return $data;
    }

    private static function jenc($v)
    {
        if ($v === null) {
            $v = [];
        }
        return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
