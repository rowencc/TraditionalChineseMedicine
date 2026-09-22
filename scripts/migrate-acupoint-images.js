#!/usr/bin/env node
/**
 * 把 acupoints.json 里 http:// 的穴位图迁移到自有服务器
 *
 * 用法：
 *   node scripts/migrate-acupoint-images.js download   # 只下载
 *   node scripts/migrate-acupoint-images.js update     # 更新 JSON 指向本地路径
 *   node scripts/migrate-acupoint-images.js all        # 下载 + 更新
 *
 * 输出目录：scripts/_staging/acupuncture/
 */
const fs = require('fs')
const path = require('path')

const DATA_FILE = path.join(__dirname, '../src/data/acupoints.json')
const STAGING_DIR = path.join(__dirname, '_staging', 'acupuncture')

function slug(name) {
  return name.replace(/[^\w\u4e00-\u9fa5]/g, '_')
}

async function download(url, dest) {
  if (fs.existsSync(dest)) {
    console.log(`  [skip] ${path.basename(dest)}`)
    return
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
}

async function downloadAll() {
  fs.mkdirSync(STAGING_DIR, { recursive: true })
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  const queue = []
  for (const meridian of data.meridians) {
    for (const point of meridian.points) {
      if (!point.image_url || !point.image_url.startsWith('http://')) continue
      queue.push({
        name: point.name,
        url: point.image_url,
        dest: path.join(STAGING_DIR, `${slug(point.name)}.jpg`),
      })
    }
  }
  let ok = 0, fail = 0
  const limit = 6
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) break
      try {
        await download(item.url, item.dest)
        ok++
        console.log(`  [ok]   ${item.name} → ${path.basename(item.dest)}`)
      } catch (e) {
        fail++
        console.warn(`  [fail] ${item.name}: ${e.message}`)
      }
    }
  })
  await Promise.all(workers)
  console.log(`\nDone: ${ok}/${queue.length + ok} ok, ${fail} failed`)
}

function updateAll() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  let changed = 0
  for (const meridian of data.meridians) {
    for (const point of meridian.points) {
      if (point.image_url && point.image_url.startsWith('http://')) {
        const fname = `${slug(point.name)}.jpg`
        if (!fs.existsSync(path.join(STAGING_DIR, fname))) {
          console.warn(`  [skip-missing] ${point.name} (no local file)`)
          continue
        }
        point.image_url = `/uploads/acupuncture/points/${fname}`
        changed++
      }
    }
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`Updated ${changed} image_url entries in ${DATA_FILE}`)
}

const cmd = process.argv[2] || 'all'
if (cmd === 'download' || cmd === 'all') {
  console.log('Downloading images...\n')
  downloadAll().then(() => {
    if (cmd === 'all') {
      console.log('\nUpdating JSON...\n')
      updateAll()
    }
  })
} else if (cmd === 'update') {
  updateAll()
} else {
  console.log(`Unknown command: ${cmd}`)
  console.log('Usage: download | update | all')
  process.exit(1)
}
