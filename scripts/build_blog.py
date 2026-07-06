#!/usr/bin/env python3
"""
ブログ記事の個別ページ（SNS共有用）を生成するスクリプト。

使い方:
  1. blog/posts/ に記事の .md ファイルを追加
  2. blog/posts.json に記事情報（date, title, tags, file, desc）を追加
  3. このスクリプトを実行する
       python3 scripts/build_blog.py
     -> blog/p/<記事ファイル名>.html が生成/更新される

生成されたページには記事ごとのタイトル・説明文・OGP情報が
静的に埋め込まれるので、X（旧Twitter）やLINEなどにリンクを貼ったときに
正しいプレビューが表示される。
"""

import html
import json
import re
from pathlib import Path

ROOT       = Path(__file__).resolve().parent.parent
BLOG_DIR   = ROOT / "blog"
POSTS_JSON = BLOG_DIR / "posts.json"
TEMPLATE   = Path(__file__).resolve().parent / "post-template.html"
OUT_DIR    = BLOG_DIR / "p"
CNAME_FILE = ROOT / "CNAME"

DEFAULT_IMAGE_PATH = "image/hinachi_001.png"
DEFAULT_DESC       = "ひなーちのブログ記事です。"


def get_base_url():
    if CNAME_FILE.exists():
        domain = CNAME_FILE.read_text(encoding="utf-8").strip()
        if domain:
            return "https://" + domain
    return ""


def slug_from_file(file_path):
    name = file_path.split("/")[-1]
    return re.sub(r"\.md$", "", name, flags=re.IGNORECASE)


def build_tags_html(tags):
    if not tags:
        return ""
    spans = "".join(
        '<span class="post-tag">{}</span>'.format(html.escape(t)) for t in tags
    )
    return '<div class="post-tags">{}</div>'.format(spans)


def render(template_text, values):
    out = template_text
    for key, value in values.items():
        out = out.replace("{{" + key + "}}", value)
    return out


def main():
    if not POSTS_JSON.exists():
        raise SystemExit("blog/posts.json が見つかりません。")

    posts = json.loads(POSTS_JSON.read_text(encoding="utf-8"))
    template_text = TEMPLATE.read_text(encoding="utf-8")
    base_url = get_base_url()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    generated = []
    for post in posts:
        title = post.get("title", "")
        date = post.get("date", "")
        file_rel = post.get("file", "")
        tags = post.get("tags", [])
        desc = post.get("desc") or DEFAULT_DESC

        if not title or not file_rel:
            print("スキップ（title または file がありません）:", post)
            continue

        slug = slug_from_file(file_rel)
        out_path = OUT_DIR / (slug + ".html")

        url = "{}/blog/p/{}.html".format(base_url, slug) if base_url else "blog/p/{}.html".format(slug)
        image = "{}/{}".format(base_url, DEFAULT_IMAGE_PATH) if base_url else DEFAULT_IMAGE_PATH
        date_iso = "{}T00:00:00+09:00".format(date) if date else ""

        values = {
            "TITLE": html.escape(title),
            "DESC": html.escape(desc),
            "URL": html.escape(url),
            "IMAGE": html.escape(image),
            "DATE": html.escape(date),
            "DATE_ISO": html.escape(date_iso),
            "TAGS_HTML": build_tags_html(tags),
            # ルート相対パスにする（".." を含む相対パスは post.js の安全チェックで弾かれるため）
            "FILE": html.escape("/blog/" + file_rel),
        }

        out_path.write_text(render(template_text, values), encoding="utf-8")
        generated.append(str(out_path.relative_to(ROOT)))

    print("{}件の個別ページを生成しました:".format(len(generated)))
    for g in generated:
        print("  -", g)


if __name__ == "__main__":
    main()
