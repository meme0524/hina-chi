#!/usr/bin/env python3
"""
ブラウザタブ用の favicon / Apple Touch Icon を生成する。

アイコン用画像（IMG_1387.png）から
32x32（タブアイコン）と 180x180（スマホのホーム画面）を作る。

外部ライブラリは使わず、make_ogp_image.py と同じ PNG 処理を流用する。

使い方:
  python3 scripts/make_favicon.py
"""

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_IMAGE = ROOT / "image" / "IMG_1387.png"
OUT_32 = ROOT / "image" / "favicon-32.png"
OUT_180 = ROOT / "image" / "apple-touch-icon.png"


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
        pos += 8 + length + 4

        if ctype == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", cdata[:10])
        elif ctype == b"IDAT":
            idat_chunks.append(cdata)
        elif ctype == b"IEND":
            break

    if bit_depth != 8 or color_type not in (2, 6):
        raise ValueError("8bit RGB/RGBA のみ対応")

    channels = 4 if color_type == 6 else 3
    raw = zlib.decompress(b"".join(idat_chunks))
    stride = width * channels
    pixels = bytearray(width * height * 4)
    prev_row = bytearray(stride)
    src_pos = 0

    for y in range(height):
        filter_type = raw[src_pos]
        src_pos += 1
        row = bytearray(raw[src_pos:src_pos + stride])
        src_pos += stride
        unfilter_row(row, prev_row, filter_type, channels)
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
    if filter_type == 1:
        for i in range(bpp, length):
            row[i] = (row[i] + row[i - bpp]) & 0xFF
    elif filter_type == 2:
        for i in range(length):
            row[i] = (row[i] + prev_row[i]) & 0xFF
    elif filter_type == 3:
        for i in range(length):
            a = row[i - bpp] if i >= bpp else 0
            b = prev_row[i]
            row[i] = (row[i] + ((a + b) // 2)) & 0xFF
    elif filter_type == 4:
        for i in range(length):
            a = row[i - bpp] if i >= bpp else 0
            b = prev_row[i]
            c = prev_row[i - bpp] if i >= bpp else 0
            row[i] = (row[i] + paeth(a, b, c)) & 0xFF


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
        raw.append(0)
        raw.extend(rgb_pixels[y * stride:(y + 1) * stride])
    idat = zlib.compress(bytes(raw), 9)

    out = bytearray(b"\x89PNG\r\n\x1a\n")
    out += chunk(b"IHDR", ihdr)
    out += chunk(b"IDAT", idat)
    out += chunk(b"IEND", b"")
    path.write_bytes(out)


def lerp(a, b, t):
    return a + (b - a) * t


def bilinear_sample(src, src_w, src_h, x, y):
    x = min(max(x, 0), src_w - 1.0001)
    y = min(max(y, 0), src_h - 1.0001)
    x0, y0 = int(x), int(y)
    x1, y1 = min(x0 + 1, src_w - 1), min(y0 + 1, src_h - 1)
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


def crop_square(src_w, src_h, src_pixels, x, y, size):
    out = bytearray(size * size * 4)
    for dy in range(size):
        for dx in range(size):
            sx = min(max(x + dx, 0), src_w - 1)
            sy = min(max(y + dy, 0), src_h - 1)
            si = (sy * src_w + sx) * 4
            di = (dy * size + dx) * 4
            out[di:di + 4] = src_pixels[si:si + 4]
    return out


def resize_rgba(src_pixels, src_size, dst_size):
    out = bytearray(dst_size * dst_size * 4)
    scale = src_size / dst_size
    for dy in range(dst_size):
        for dx in range(dst_size):
            sx = (dx + 0.5) * scale - 0.5
            sy = (dy + 0.5) * scale - 0.5
            r, g, b, a = bilinear_sample(src_pixels, src_size, src_size, sx, sy)
            di = (dy * dst_size + dx) * 4
            out[di:di + 3] = bytes(int(round(v)) for v in (r, g, b))
            out[di + 3] = int(round(a))
    return out


def rgba_to_rgb(pixels, width, height):
    rgb = bytearray(width * height * 3)
    for y in range(height):
        for x in range(width):
            si = (y * width + x) * 4
            di = (y * width + x) * 3
            alpha = pixels[si + 3] / 255.0
            bg = (255, 247, 237)  # --orange-50
            for c in range(3):
                rgb[di + c] = int(round(lerp(bg[c], pixels[si + c], alpha)))
    return rgb


def save_icon(path, rgba_pixels, size):
    rgb = rgba_to_rgb(rgba_pixels, size, size)
    write_png_rgb(path, size, size, rgb)


def main():
    src_w, src_h, src_pixels = read_png_rgba(SRC_IMAGE)
    crop_size = min(src_w, src_h)
    x = (src_w - crop_size) // 2
    y = (src_h - crop_size) // 2
    crop = crop_square(src_w, src_h, src_pixels, x, y, crop_size)

    save_icon(OUT_32, resize_rgba(crop, crop_size, 32), 32)
    save_icon(OUT_180, resize_rgba(crop, crop_size, 180), 180)

    print("生成しました:")
    print(" ", OUT_32.relative_to(ROOT))
    print(" ", OUT_180.relative_to(ROOT))


if __name__ == "__main__":
    main()
