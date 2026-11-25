#!/usr/bin/env python3
# Acu361 单穴渲染 v7：法线选视图 + 遮挡检测 + 绕Y轴/X轴旋转 + 贴身平角短裤（几何压平+柔边布面）。
# v7 支持的 render(..., rot_x=70) 用于头顶/足背等需要真正俯视的角度。
import json, struct, sys, math, os
from PIL import Image, ImageDraw, ImageFont

REPO = "/tmp/Acu361"
BODY = "skin.glb"
FONT = "/usr/share/fonts/google-droid/DroidSansFallback.ttf"

OVERRIDES = {"行间": (101.9, 23.1, 129.0)}

DIRS = {"front": (0, 0, 1), "back": (0, 0, -1), "left": (1, 0, 0), "right": (-1, 0, 0), "top": (0, 1, 0)}

SHORTS_Y = (690.0, 905.0)
SHORTS_X = 155.0
CLOTH = (214, 217, 222)
CLOTH_WAIST = (188, 193, 202)
CLOTH_HEM = (196, 200, 208)

def load_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    magic, ver, length = struct.unpack_from("<4sII", data, 0)
    assert magic == b"glTF"
    off, js, binc = 12, None, None
    while off < length:
        clen, ctype = struct.unpack_from("<II", data, off)
        chunk = data[off + 8: off + 8 + clen]
        if ctype == 0x4E4F534A:
            js = json.loads(chunk.decode("utf-8"))
        elif ctype == 0x004E4942:
            binc = chunk
        off += 8 + clen + ((4 - clen % 4) % 4)
    return js, binc

def read_accessor(js, buf, idx):
    acc = js["accessors"][idx]
    bv = js["bufferViews"][acc["bufferView"]]
    fmt = {5126: ("f", 4), 5125: ("I", 4), 5123: ("H", 2), 5121: ("B", 1)}[acc["componentType"]]
    ncomp = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[acc["type"]]
    base = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    stride = bv.get("byteStride") or (fmt[1] * ncomp)
    out = []
    for i in range(acc["count"]):
        vals = struct.unpack_from("<" + fmt[0] * ncomp, buf, base + i * stride)
        out.append(vals if ncomp > 1 else vals[0])
    return out

_M = {}
def mesh():
    if not _M:
        js, buf = load_glb(os.path.join(REPO, "data/body", BODY))
        prim = js["meshes"][0]["primitives"][0]
        _M["v"] = read_accessor(js, buf, prim["attributes"]["POSITION"])
        _M["n"] = read_accessor(js, buf, prim["attributes"]["NORMAL"])
        idx = read_accessor(js, buf, prim["indices"])
        _M["f"] = [tuple(idx[i:i + 3]) for i in range(0, len(idx), 3)]
    return _M["v"], _M["n"], _M["f"]

_P = {}
def points():
    if not _P:
        _P["all"] = json.load(open(os.path.join(REPO, "data/points.json"), encoding="utf-8"))["points"]
    return _P["all"]

def projector(view):
    return {
        "front": lambda v: (v[0], v[1], v[2]),
        "back":  lambda v: (-v[0], v[1], -v[2]),
        "left":  lambda v: (v[2], v[1], v[0]),
        "right": lambda v: (-v[2], v[1], -v[0]),
        "top":   lambda v: (v[0], v[2], -v[1]),
    }[view]

def snap(p):
    verts, norms, faces = mesh()
    best, bi = 1e18, 0
    for i, v in enumerate(verts):
        d = (v[0]-p[0])**2 + (v[1]-p[1])**2 + (v[2]-p[2])**2
        if d < best:
            best, bi = d, i
    return [verts[bi][0], verts[bi][1], verts[bi][2]], norms[bi]

def rot_y(v, deg):
    if not deg:
        return v
    t = math.radians(deg)
    c, s = math.cos(t), math.sin(t)
    return (v[0]*c - v[2]*s, v[1], v[0]*s + v[2]*c)

_G = {}
def depth_grid(view, cell=5.0):
    key = (view, cell)
    if key in _G:
        return _G[key]
    verts, norms, faces = mesh()
    proj = projector(view)
    g = {}
    for f in faces:
        a, b, c = proj(verts[f[0]]), proj(verts[f[1]]), proj(verts[f[2]])
        z = (a[2] + b[2] + c[2]) / 3.0
        x = (a[0] + b[0] + c[0]) / 3.0
        y = (a[1] + b[1] + c[1]) / 3.0
        k = (int(x // cell), int(y // cell))
        if z > g.get(k, -1e9):
            g[k] = z
    _G[key] = g
    return g

def occluded(view, p, cell=5.0, rad=1, tol=18.0):
    proj = projector(view)
    px, py, pz = proj(p)
    g = depth_grid(view, cell)
    i0, j0 = int(px // cell), int(py // cell)
    for i in range(i0 - rad, i0 + rad + 1):
        for j in range(j0 - rad, j0 + rad + 1):
            if g.get((i, j), -1e9) > pz + tol:
                return True
    return False

def render(name, view, zoom, out_path, size=620, ss=2, offset=(0.0, 0.0), label=True,
           rotate=0.0, shorts=False, cull=True, rot_x=0.0):
    verts, norms, faces = mesh()
    cand = [p for p in points() if p.get("name_zh") == name]
    if not cand:
        raise SystemExit("point not found: " + name)
    want = {"left": "L", "right": "R"}.get(view, "L")
    p = dict(next((x for x in cand if x.get("side") == want), cand[0]))
    if name in OVERRIDES:
        p["pos"] = list(OVERRIDES[name])
    p["pos"], _ = snap(p["pos"])

    if rot_x:
        t = math.radians(rot_x); c, s2 = math.cos(t), math.sin(t)
        def _rx(v): return (v[0], v[1]*c - v[2]*s2, v[1]*s2 + v[2]*c)
        verts = [_rx(v) for v in verts]; norms = [_rx(n) for n in norms]; p["pos"] = _rx(p["pos"])
    if rotate:
        verts = [rot_y(v, rotate) for v in verts]
        norms = [rot_y(n, rotate) for n in norms]
        p["pos"] = rot_y(p["pos"], rotate)

    GEN = (-80.0, 80.0, 840.0, 975.0, 80.0, 200.0)
    if shorts:
        verts = [(v[0], v[1], (90.0 + (v[2]-90.0)*0.05) if (abs(v[0]) < 72 and 660 < v[1] < 890 and v[2] > 90) else v[2]) for v in verts]
    if shorts:
        def _gen(f):
            c = ((verts[f[0]][0]+verts[f[1]][0]+verts[f[2]][0])/3.0,
                 (verts[f[0]][1]+verts[f[1]][1]+verts[f[2]][1])/3.0,
                 (verts[f[0]][2]+verts[f[1]][2]+verts[f[2]][2])/3.0)
            return GEN[0] <= c[0] <= GEN[1] and GEN[2] <= c[1] <= GEN[3] and GEN[4] <= c[2] <= GEN[5]
        pass

    off_v = None

    proj = projector(view)
    P = [proj(v) for v in verts]
    Poff = [proj(v) for v in off_v] if off_v else None
    px, py, pz = proj(p["pos"])
    cx, cy = px + offset[0], py + offset[1]
    half = zoom / 2.0
    W = H = size * ss
    scale = W / zoom

    def to_px(x, y):
        return ((x - (cx - half)) * scale, ((cy + half) - y) * scale)

    img = Image.new("RGB", (W, H), (247, 243, 236))
    drw = ImageDraw.Draw(img)
    cmask = Image.new("L", (W, H), 0)
    cdrw = ImageDraw.Draw(cmask)
    bmask = Image.new("L", (W, H), 0)
    bdrw = ImageDraw.Draw(bmask)

    light = (0.40, 0.48, 0.78)
    ln = math.sqrt(sum(c * c for c in light))
    light = tuple(c / ln for c in light)

    tris = []
    for f in faces:
        cw = ((verts[f[0]][0] + verts[f[1]][0] + verts[f[2]][0]) / 3.0,
              (verts[f[0]][1] + verts[f[1]][1] + verts[f[2]][1]) / 3.0,
              (verts[f[0]][2] + verts[f[1]][2] + verts[f[2]][2]) / 3.0)
        is_short = False
        a, b, c = P[f[0]], P[f[1]], P[f[2]]
        if max(a[0], b[0], c[0]) < cx - half - 5 or min(a[0], b[0], c[0]) > cx + half + 5:
            continue
        if max(a[1], b[1], c[1]) < cy - half - 5 or min(a[1], b[1], c[1]) > cy + half + 5:
            continue
        z = (a[2] + b[2] + c[2]) / 3.0 - (1.0 if is_short else 0.0)
        tris.append((z, a, b, c, is_short, cw[1]))
    tris.sort(key=lambda t: t[0])

    skin = (228, 201, 176)
    for z, a, b, c, is_short, wy in tris:
        u = (b[0] - a[0], b[1] - a[1], b[2] - a[2])
        w = (c[0] - a[0], c[1] - a[1], c[2] - a[2])
        nx = u[1] * w[2] - u[2] * w[1]
        ny = u[2] * w[0] - u[0] * w[2]
        nz = u[0] * w[1] - u[1] * w[0]
        nl = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        if cull and nz <= 0:
            continue
        lam = abs((nx * light[0] + ny * light[1] + nz * light[2]) / nl)
        k = 0.62 + 0.38 * lam
        if is_short:
            base = CLOTH_WAIST if wy >= SHORTS_Y[1] - 10 else (CLOTH_HEM if wy <= SHORTS_Y[0] + 5 else CLOTH)
            k = 0.72 + 0.28 * lam
        else:
            base = skin
        pts = [to_px(a[0], a[1]), to_px(b[0], b[1]), to_px(c[0], c[1])]
        drw.polygon(pts, fill=(int(base[0] * k), int(base[1] * k), int(base[2] * k)))
        (bdrw if is_short else cdrw).polygon(pts, fill=255)

    if shorts:
        from PIL import ImageFilter
        y_top = int(to_px(0, SHORTS_Y[1])[1]); y_bot = int(to_px(0, SHORTS_Y[0])[1])
        y0, y1 = max(0, min(y_top, y_bot)), min(H, max(y_top, y_bot))
        gray = img.convert("L")
        # 会阴区域先强模糊，避免布料贴出解剖细节
        gray = gray.filter(ImageFilter.GaussianBlur(6 * ss))
        gp = gray.load(); pix = img.load(); mk = cmask.load()
        band = max(1, y1 - y0)
        for yy in range(y0, y1):
            t = (yy - y0) / band
            shade = 1.0 - 0.05 * t
            col = CLOTH_WAIST if yy < y0 + max(3, int(12 * ss)) else (CLOTH_HEM if yy > y1 - max(2, int(4 * ss)) else CLOTH)
            x = 0
            while x < W:
                if mk[x, yy]:
                    x2 = x
                    while x2 < W and mk[x2, yy]:
                        x2 += 1
                    for xx in range(x, x2):
                        lum = 1.0 + (gp[xx, yy] / 210.0 - 1.0) * 0.72
                        pix[xx, yy] = (min(255, int(col[0] * lum * shade)),
                                       min(255, int(col[1] * lum * shade)),
                                       min(255, int(col[2] * lum * shade)))
                    x = x2
                else:
                    x += 1
    if shorts and view == "front":
        from PIL import ImageFilter, ImageChops
        m = Image.new("L", (W, H), 0); md = ImageDraw.Draw(m)
        ex0 = int(to_px(-62, 0)[0]); ex1 = int(to_px(62, 0)[0])
        ey1 = int(to_px(0, 648)[1]); ey0 = int(to_px(0, 884)[1])
        md.ellipse([min(ex0, ex1), min(ey0, ey1), max(ex0, ex1), max(ey0, ey1)], fill=255)
        m = m.filter(ImageFilter.GaussianBlur(16 * ss))
        band = Image.new("L", (W, H), 0)
        band.paste(cmask.crop((0, y0, W, y1)), (0, y0))
        m = ImageChops.multiply(m, band)
        img.paste(Image.new("RGB", (W, H), CLOTH), (0, 0), m)
    img = img.resize((size, size), Image.LANCZOS)
    drw = ImageDraw.Draw(img)
    mx, my = to_px(px, py)
    mx, my = mx / ss, my / ss
    r = 13
    drw.ellipse([mx - r - 3, my - r - 3, mx + r + 3, my + r + 3], fill=(255, 255, 255))
    drw.ellipse([mx - r, my - r, mx + r, my + r], fill=(214, 40, 40), outline=(120, 10, 10), width=2)
    drw.ellipse([mx - 4, my - 4, mx + 4, my + 4], fill=(255, 230, 120))

    if label:
        f1 = ImageFont.truetype(FONT, 26)
        f2 = ImageFont.truetype(FONT, 16)
        txt = name + (" " + p["code"] if p.get("code") else "")
        tw = drw.textlength(txt, font=f1)
        bx0 = min(max(mx + 20, 8), size - tw - 18)
        by0 = min(max(my - 46, 8), size - 44)
        drw.rectangle([bx0 - 6, by0 - 4, bx0 + tw + 6, by0 + 32], fill=(255, 255, 255))
        drw.text((bx0, by0), txt, font=f1, fill=(40, 30, 25))
        drw.text((12, size - 26), "Acu361 · CC BY-SA 4.0", font=f2, fill=(150, 140, 128))

    img.save(out_path, "JPEG", quality=90, optimize=True)
    print(f"{name} {p['code']} {view} zoom={zoom} rot={rotate} shorts={shorts} -> {out_path}")

if __name__ == "__main__":
    render(sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4])
