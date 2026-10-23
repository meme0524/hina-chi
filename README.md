# hina-chi

ひなーちの個人サイトです。REALITY の配信予定、お知らせ、イベント実績、ギャラリー、ブログ、コラボ案内をまとめています。

公開先: [https://www.hina-chi.jp](https://www.hina-chi.jp)

## 技術

- [Astro](https://astro.build/) 7
- Node.js 22.12 以上
- `main` への push で GitHub Actions がビルドし、GitHub Pages に公開する

## ローカルで見る

```bash
npm install
npm run dev
```

本番と同じ出力を確認するときは次です。

```bash
npm run build
npm run preview
```

## ページ

| パス | 内容 |
| --- | --- |
| `/` | トップ（自己紹介、配信予定、お知らせ、イベント） |
| `/gallery/` | ファンアートと配信スクショ |
| `/news/` | お知らせ一覧 |
| `/events/` | イベント実績 |
| `/plans/` | 配信企画（パスワードが必要） |
| `/collab/` | コラボの案内 |
| `/blog/` | ブログ一覧と本文 |
| `/blog/p/<slug>/` | ブログの個別ページ |
| `/tools/roulette/` | 配信用ルーレット |
| `/tools/dice/` | 配信用サイコロ |

## 内容の更新

| 変えたいもの | 編集する場所 |
| --- | --- |
| お知らせ | `src/data/news.js`（新しいものを上に追加。トップは最新 4 件） |
| イベント実績 | `src/data/events.js`（新しいものを上に追加。トップは最新 3 件） |
| 配信予定 | `src/data/schedule.js`（`SCHEDULE_REGULAR` が定例、`SCHEDULE_SPECIALS` が単発。日付を過ぎた単発は非表示） |
| ギャラリー | 画像を `public/image/gallery/` に置き、`src/data/gallery.js` に追加 |
| 配信企画 | `src/data/plans.js` |
| 企画ページのパスワード | `src/data/plans-auth.js` のコメントにある手順でハッシュを差し替える |
| コラボ案内 | `src/data/collab.js` |
| サイト名・説明 | `src/data/site.js` |
| YouTube | `src/data/youtube.js` |

ブログは `src/content/blog/` に Markdown を追加します。ファイル名（拡張子を除く）が URL の slug になります。先頭の frontmatter は次の形です。

```md
---
title: "タイトル"
date: "2026-10-13"
tags: ["日記"]
desc: "一覧や共有用の短い説明"
---
```

本文はビルド時に HTML になります。`date` は `YYYY-MM-DD` です。

## 画像

OGP 画像と favicon は、次のスクリプトで作り直せます。外部ライブラリは不要です。

```bash
python3 scripts/make_ogp_image.py
python3 scripts/make_favicon.py
```

## 公開

`main` に push すると `.github/workflows/deploy.yml` が `npm ci` と `npm run build` を実行し、`dist/` を GitHub Pages にデプロイします。カスタムドメインは `public/CNAME`（`www.hina-chi.jp`）です。
