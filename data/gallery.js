// ======================================
//  ギャラリー画像を書き込む場所
//  ファンアート・配信スクショなど、なんでも載せられます
//
//  { src, alt, type, caption, url }
//    src     … 画像パス（image/gallery/ 以下がおすすめ）
//    alt     … 画像の説明
//    type    … "fanart" | "screenshot"（省略時 fanart）
//    caption … 下に出すテキスト（作者名・配信日・タイトルなど）
//    url     … 元投稿・配信アーカイブなど（任意）
//
//  新しいものを上に追加してください
// ======================================
var GALLERY = [
  {
    src: "image/gallery/fanart/003-mio-sakuya.png",
    alt: "マフラー姿のひなーちのチビキャラファンアート",
    type: "fanart",
    caption: "澪海 桜弥 さん"
  },
  {
    src: "image/gallery/screenshots/001-plushie-rocking-chair.png",
    alt: "ロッキングチェアでうさぎのぬいぐるみを抱えている配信スクショ",
    type: "screenshot",
    caption: "うさぎぬいぐるみと一息"
  },
  {
    src: "image/gallery/screenshots/002-chapel-outfit.png",
    alt: "チャペル衣装で杖を持っている配信スクショ",
    type: "screenshot",
    caption: "チャペルコーデ"
  },
  {
    src: "image/gallery/fanart/001-hapiba.png",
    alt: "ハピバ！と書かれたひなーちのチビキャラファンアート",
    type: "fanart",
    caption: "鳥羽雛丸 さん",
    url: "https://x.com/toba_hinamaru"
  },
  {
    src: "image/gallery/fanart/002-rookie-thanks.png",
    alt: "ルーキー5位記念のお礼イラスト",
    type: "fanart",
    caption: "鳥羽雛丸 さん",
    url: "https://x.com/toba_hinamaru"
  },
];
