#!/usr/bin/env python3
# 批量渲染 62 个缺图穴位（v2 光照 + 精确取景），生成 4 张总览图。
import os, sys, json
sys.path.insert(0, "/tmp")
from render_acupoint2 import render
from PIL import Image, ImageDraw, ImageFont

OUT = "/tmp/acu62"
os.makedirs(OUT, exist_ok=True)

# name: (view, zoom, offset_x, offset_y)
PRESETS = {
    "四白": ("front", 220, 0, 0), "下关": ("left", 230, 0, 0), "头维": ("front", 240, 0, 0),
    "气户": ("front", 420, 0, 0), "屋翳": ("front", 460, 0, 0), "膺窗": ("front", 460, 0, 0),
    "乳中": ("front", 440, 0, 0), "乳根": ("front", 460, 0, 0), "太乙": ("front", 440, 0, 20),
    "水道": ("front", 320, 0, 60), "下巨虚": ("left", 340, 0, 0),
    "商丘": ("left", 250, 0, 0), "食窦": ("front", 460, 0, 0), "天溪": ("front", 460, 0, 0),
    "胸乡": ("front", 450, 0, 0),
    "前谷": ("back", 200, 0, 0), "曲垣": ("back", 380, 0, 0), "天容": ("left", 280, 0, 0),
    "通天": ("back", 250, 0, 0), "络却": ("back", 250, 0, 0), "气海俞": ("back", 430, 0, 0),
    "中膂俞": ("back", 430, 0, 0), "中髎": ("back", 400, 0, 0), "下髎": ("back", 400, 0, 0),
    "魄户": ("back", 420, 0, 0), "譩譆": ("back", 420, 0, 0), "阳纲": ("back", 430, 0, 0),
    "秩边": ("back", 420, 0, 20), "仆参": ("left", 240, 0, 0),
    "气穴": ("front", 300, 0, 70), "四满": ("front", 320, 0, 55),
    "中注": ("front", 320, 0, 55), "商曲": ("front", 400, 0, 30),
    "石关": ("front", 420, 0, 25), "阴都": ("front", 420, 0, 20), "幽门": ("front", 420, 0, 0),
    "三阳络": ("left", 380, 0, 0), "四渎": ("left", 380, 0, 0), "天井": ("left", 380, 0, 0),
    "消泺": ("left", 340, 0, 0), "臑会": ("left", 340, 0, 0), "丝竹空": ("front", 230, 0, 0),
    "听会": ("right", 210, 0, 0), "上关": ("right", 220, 0, 0), "悬颅": ("right", 230, 0, 0),
    "曲鬓": ("right", 230, 0, 0), "天冲": ("right", 230, 0, 0), "头窍阴": ("right", 230, 0, 0),
    "头临泣": ("front", 240, 0, 0), "目窗": ("front", 240, 0, 0), "脑空": ("right", 230, 0, 0),
    "渊腋": ("right", 430, 0, 0), "辄筋": ("right", 430, 0, 0), "五枢": ("back", 470, 0, 0),
    "维道": ("back", 470, 0, 0), "阳交": ("right", 340, 0, 0),
    "行间": ("top", 200, 0, 0), "中封": ("left", 250, 0, 0), "中都": ("left", 330, 0, 0),
    "膝关": ("left", 330, 0, 0), "足五里": ("left", 280, -115, 0), "阴廉": ("left", 280, -115, 0),
}

rows = []
for name, (view, zoom, ox, oy) in PRESETS.items():
    out = os.path.join(OUT, name + ".jpg")
    try:
        render(name, view, zoom, out, shorts=False, offset=(ox, oy))
        rows.append((name, view, zoom, out))
    except Exception as e:
        print("FAIL", name, e)

print("rendered", len(rows))

font = ImageFont.truetype("/usr/share/fonts/google-droid/DroidSansFallback.ttf", 20)
TH, per = 340, 16
for s in range((len(rows) + per - 1) // per):
    chunk = rows[s * per:(s + 1) * per]
    sheet = Image.new("RGB", (4 * TH, 4 * (TH + 26)), (255, 255, 255))
    drw = ImageDraw.Draw(sheet)
    for i, (name, view, zoom, path) in enumerate(chunk):
        im = Image.open(path).resize((TH, TH), Image.LANCZOS)
        x, y = (i % 4) * TH, (i // 4) * (TH + 26)
        sheet.paste(im, (x, y))
        drw.text((x + 6, y + TH + 3), f"{s*per+i+1}.{name} {view} {int(zoom)}", font=font, fill=(30, 30, 30))
    sp = f"/tmp/acu62_sheet{s+1}.jpg"
    sheet.save(sp, "JPEG", quality=88)
    print(sp, os.path.getsize(sp))
