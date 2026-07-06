#!/usr/bin/env python3
"""
SNS共有用（OGP）の横長サムネイル画像を生成するスクリプト。

背景: 元のアバター画像は縦長（1024x1280）だが、X（Twitter）やLINEなどの
リンクプレビューは横長（1200x630 = 1.91:1）の枠に「切り抜いて」表示するため、
そのまま og:image に使うと顔や頭が見切れてしまう。

このスクリプトは、縦長のアバター画像を「切り抜かず」に横長キャンバスの中央に
収め（contain）、周りをブランドカラーのグラデーションで埋めた
1200x630 の画像を作る。

外部ライブラリ（Pillowなど）は使わず、標準ライブラリの zlib/struct だけで
PNGのデコード・エンコードを行う。

使い方:
  python3 scripts/make_ogp_image.py
"""

import struct
import zlib
from pathlib import Path

ROOT       = Path(__file__).resolve().parent.parent
SRC_IMAGE  = ROOT / "image" / "hinachi_001.png"
OUT_IMAGE  = ROOT / "image" / "hinachi_ogp.png"

CANVAS_W = 1200
CANVAS_H = 630
MARGIN_Y = 36  # 上下の余白

# ブランドカラー（style.css の --orange-100 / --orange-50 / --white に合わせたグラデーション）
GRADIENT_TOP    = (255, 237, 213)  # --orange-100
GRADIENT_MIDDLE = (255, 247, 237)  # --orange-50
GRADIENT_BOTTOM = (255, 255, 255)  # --white


# ---------- PNG デコード ----------

def read_png_rgba(path):
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "PNGファイルではありません"

    pos = 8
    width = height = bit_depth = color_type = None
    idat_chunks = []

    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        ctype = data[pos + 4:pos + 8]
        cdata = data[pos + 8:pos + 8 + length]
        pos += 8 + length + 4  # +4 for CRC

        if ctype == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", cdata[:10])
        elif ctype == b"IDAT":
            idat_chunks.append(cdata)
        elif ctype == b"IEND":
            break

    if bit_depth != 8 or color_type not in (2, 6):
        raise ValueError("対応していないPNG形式です（8bit RGB/RGBA のみ対応）: bit_depth={}, color_type={}".format(bit_depth, color_type))

    channels = 4 if color_type == 6 else 3
    raw = zlib.decompress(b"".join(idat_chunks))

    stride = width * channels
    pixels = bytearray(width * height * 4)  # 出力は常にRGBA
    prev_row = bytearray(stride)

    src_pos = 0
    for y in range(height):
        filter_type = raw[src_pos]
        src_pos += 1
        row = bytearray(raw[src_pos:src_pos + stride])
        src_pos += stride

        unfilter_row(row, prev_row, filter_type, channels)

        # RGBA に正規化して書き込み
        out_off = y * width * 4
        if channels == 4:
            pixels[out_off:out_off + stride] = row
        else:
            for x in range(width):
                si = x * 3
                di = out_off + x * 4
                pixels[di:di + 3] = row[si:si + 3]
                pixels[di + 3] = 255

        prev_row = row

    return width, height, pixels


def paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def unfilter_row(row, prev_row, filter_type, bpp):
    length = len(row)
    if filter_type == 0:
        return
    if filter_type == 1:  # Sub
        for i in range(bpp, length):
            row[i] = (row[i] + row[i - bpp]) & 0xFF
    elif filter_type == 2:  # Up
        for i in range(length):
            row[i] = (row[i] + prev_row[i]) & 0xFF
    elif filter_type == 3:  # Average
        for i in range(length):
            a = row[i - bpp] if i >= bpp else 0
            b = prev_row[i]
            row[i] = (row[i] + ((a + b) // 2)) & 0xFF
    elif filter_type == 4:  # Paeth
        for i in range(length):
            a = row[i - bpp] if i >= bpp else 0
            b = prev_row[i]
            c = prev_row[i - bpp] if i >= bpp else 0
            row[i] = (row[i] + paeth(a, b, c)) & 0xFF
    else:
        raise ValueError("未対応のフィルタタイプ: {}".format(filter_type))


# ---------- PNG エンコード（RGB, フィルタなし） ----------

def write_png_rgb(path, width, height, rgb_pixels):
    def chunk(ctype, cdata):
        return (
            struct.pack(">I", len(cdata))
            + ctype
            + cdata
            + struct.pack(">I", zlib.crc32(ctype + cdata) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)

    stride = width * 3
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # フィルタタイプ: None
        raw.extend(rgb_pixels[y * stride:(y + 1) * stride])

    idat = zlib.compress(bytes(raw), 9)

    out = bytearray(b"\x89PNG\r\n\x1a\n")
    out += chunk(b"IHDR", ihdr)
    out += chunk(b"IDAT", idat)
    out += chunk(b"IEND", b"")
    path.write_bytes(out)


# ---------- 合成処理 ----------

def lerp(a, b, t):
    return a + (b - a) * t


def gradient_color(y, height):
    t = y / max(height - 1, 1)
    if t < 0.5:
        t2 = t / 0.5
        c0, c1 = GRADIENT_TOP, GRADIENT_MIDDLE
    else:
        t2 = (t - 0.5) / 0.5
        c0, c1 = GRADIENT_MIDDLE, GRADIENT_BOTTOM
    return tuple(int(round(lerp(c0[i], c1[i], t2))) for i in range(3))


def bilinear_sample(src, src_w, src_h, x, y):
    x = min(max(x, 0), src_w - 1.0001)
    y = min(max(y, 0), src_h - 1.0001)
    x0, y0 = int(x), int(y)
    x1, y1 = x0 + 1, y0 + 1
    fx, fy = x - x0, y - y0

    def px(xx, yy):
        i = (yy * src_w + xx) * 4
        return src[i], src[i + 1], src[i + 2], src[i + 3]

    p00, p10 = px(x0, y0), px(x1, y0)
    p01, p11 = px(x0, y1), px(x1, y1)

    out = []
    for c in range(4):
        top = lerp(p00[c], p10[c], fx)
        bottom = lerp(p01[c], p11[c], fx)
        out.append(lerp(top, bottom, fy))
    return out


def main():
    src_w, src_h, src_pixels = read_png_rgba(SRC_IMAGE)

    target_h = CANVAS_H - MARGIN_Y * 2
    scale = target_h / src_h
    target_w = round(src_w * scale)
    if target_w > CANVAS_W:
        scale = CANVAS_W / src_w
        target_w = CANVAS_W
        target_h = round(src_h * scale)

    x_offset = (CANVAS_W - target_w) // 2
    y_offset = (CANVAS_H - target_h) // 2

    canvas = bytearray(CANVAS_W * CANVAS_H * 3)
    for y in range(CANVAS_H):
        bg = gradient_color(y, CANVAS_H)
        row_off = y * CANVAS_W * 3
        for x in range(CANVAS_W):
            i = row_off + x * 3
            canvas[i:i + 3] = bytes(bg)

    for dy in range(target_h):
        sy = dy / scale
        cy = y_offset + dy
        if cy < 0 or cy >= CANVAS_H:
            continue
        for dx in range(target_w):
            sx = dx / scale
            r, g, b, a = bilinear_sample(src_pixels, src_w, src_h, sx, sy)
            alpha = a / 255.0
            if alpha <= 0:
                continue
            cx = x_offset + dx
            if cx < 0 or cx >= CANVAS_W:
                continue
            i = (cy * CANVAS_W + cx) * 3
            bg_r, bg_g, bg_b = canvas[i], canvas[i + 1], canvas[i + 2]
            canvas[i]     = int(round(lerp(bg_r, r, alpha)))
            canvas[i + 1] = int(round(lerp(bg_g, g, alpha)))
            canvas[i + 2] = int(round(lerp(bg_b, b, alpha)))

    write_png_rgb(OUT_IMAGE, CANVAS_W, CANVAS_H, canvas)
    print("生成しました:", OUT_IMAGE.relative_to(ROOT), "({}x{})".format(CANVAS_W, CANVAS_H))


if __name__ == "__main__":
    main()
