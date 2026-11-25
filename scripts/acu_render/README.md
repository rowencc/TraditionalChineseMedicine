# 穴位图渲染脚本（Acu361 开放数据）

用 Acu361（CC BY-SA 4.0）的人体模型与穴位坐标，渲染统一风格的穴位示意图。

## 依赖

- Acu361 仓库：`git clone --depth 1 https://github.com/Elwyn921/Acu361.git /tmp/Acu361`
- Python 3.11 + Pillow（`python3.11 -m pip install pillow`）
- 中文字体：`/usr/share/fonts/google-droid/DroidSansFallback.ttf`

## 用法

```bash
# 单穴：名称 视图 缩放(mm) 输出
python3.11 render_point.py 乳中 front 440 /tmp/乳中.jpg

# 批量（62 个缺图穴位 + 4 张总览图）
python3.11 render_batch.py
```

视图取值：`front`（正面）、`back`（背面）、`left`/`right`（患者左/右侧）、`top`（俯视）。
`render_point.py` 的 `render()` 还支持 `offset=(x, y)`（取景偏移，单位 mm，用于避开盆底等区域）与 `shorts=False`。

## 许可

模型与坐标数据来自 Acu361，采用 CC BY-SA 4.0。渲染图中已烧录 `Acu361 · CC BY-SA 4.0` 字样；
对外使用时须保留署名，并以相同协议共享这些渲染图。
