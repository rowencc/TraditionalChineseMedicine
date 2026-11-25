#!/usr/bin/env bash
# 本地知识库 → 服务端全量同步（幂等，可重复执行）
#
# 同步内容：
#   src/data/formulas.json   → 服务端 data/formulas.json + MySQL tcm_formula
#   src/data/acupoints.json  → 服务端 data/acupoints.json + MySQL tcm_acupoint
#
# 用法：
#   ./scripts/sync-knowledge.sh --dry-run    # 预演，不写库
#   ./scripts/sync-knowledge.sh              # 正式同步
#
# 连接参数（可用环境变量覆盖）：
#   NHX_HOST   默认 root@47.94.58.173
#   NHX_PORT   默认 3328
#   NHX_REMOTE 默认 /home/wwwroot/tcm.rowen.cc
#   SSHPASS    密码认证时导出该变量（配合 sshpass -e，命令行不留密码）
#
# 例：SSHPASS='******' ./scripts/sync-knowledge.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${NHX_HOST:-root@47.94.58.173}"
PORT="${NHX_PORT:-3328}"
REMOTE="${NHX_REMOTE:-/home/wwwroot/tcm.rowen.cc}"
DATA_DIR="$ROOT/src/data"

SSH_OPTS=(-o StrictHostKeyChecking=no -o ControlPath="/tmp/nhx_ssh_%r@%h:%p" -p "$PORT")
if [ -n "${SSHPASS:-}" ]; then
  SSH=(sshpass -e ssh "${SSH_OPTS[@]}")
  SCP=(sshpass -e scp -o StrictHostKeyChecking=no -P "$PORT")
else
  SSH=(ssh "${SSH_OPTS[@]}")
  SCP=(scp -o StrictHostKeyChecking=no -P "$PORT")
fi

echo "== 1/4 本地数据校验 =="
python3 - "$DATA_DIR" <<'PY'
import json, sys, collections
d = sys.argv[1]
f = json.load(open(f"{d}/formulas.json", encoding="utf-8"))
a = json.load(open(f"{d}/acupoints.json", encoding="utf-8"))
names = [x["name"] for x in f]
dup = [k for k, v in collections.Counter(names).items() if v > 1]
points = sum(len(m["points"]) for m in a["meridians"])
missing = [x["name"] for x in f if not x.get("meridian") or not x.get("composition")]
print(f"  方剂 {len(f)} 条 / 唯一 {len(set(names))}；穴位 {points} 个 / {len(a['meridians'])} 条经络")
if dup:
    sys.exit(f"  方剂存在重名: {dup}")
if missing:
    sys.exit(f"  方剂缺 meridian/composition: {missing[:5]}")
print("  校验通过")
PY

echo "== 2/4 备份并上传 JSON =="
"${SSH[@]}" "$HOST" "cd $REMOTE && ts=\$(date +%Y%m%d_%H%M%S) && for f in formulas.json acupoints.json; do [ -f data/\$f ] && cp data/\$f data/\$f.bak.\$ts; done; ls -1 data/*.bak.* 2>/dev/null | tail -4"
"${SCP[@]}" "$DATA_DIR/formulas.json" "$DATA_DIR/acupoints.json" "$HOST:$REMOTE/data/"
"${SCP[@]}" "$ROOT/server/sync_tcm_data.php" "$HOST:$REMOTE/public/sync_tcm_data.php"
"${SCP[@]}" "$ROOT/server/core/KnowledgeSync.php" "$HOST:$REMOTE/core/KnowledgeSync.php"

echo "== 3/4 幂等入库 =="
"${SSH[@]}" "$HOST" "cd $REMOTE && php public/sync_tcm_data.php $*"

echo "== 4/4 文件一致性 =="
LOCAL_F=$(md5 -q "$DATA_DIR/formulas.json" 2>/dev/null || md5sum "$DATA_DIR/formulas.json" | cut -d' ' -f1)
LOCAL_A=$(md5 -q "$DATA_DIR/acupoints.json" 2>/dev/null || md5sum "$DATA_DIR/acupoints.json" | cut -d' ' -f1)
"${SSH[@]}" "$HOST" "cd $REMOTE && echo \"  formulas  本地 $LOCAL_F / 服务端 \$(md5sum data/formulas.json | cut -d' ' -f1)\"; echo \"  acupoints 本地 $LOCAL_A / 服务端 \$(md5sum data/acupoints.json | cut -d' ' -f1)\""

echo "完成。"
