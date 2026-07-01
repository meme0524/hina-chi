// ======================================
//  お知らせを書き込む場所
//  { date: "YYYY-MM-DD", text: "本文" }
//  新しいものを上に追加してください
// ======================================
var NEWS = [
  // 例（不要になったら行ごと削除してOK）
 { date: "2026-07-01", text: "今日の配信は23:00スタートに変更します！" },
];

// ---- 以下は触らなくてOK ----
(function () {
  var list = document.getElementById("news-list");
  if (!list) return;

  var items = NEWS.filter(function (n) { return n && n.text; });
  if (items.length === 0) return;

  list.innerHTML = items.map(function (n) {
    var d = n.date ? "<time class=\"news-date\" datetime=\"" + n.date + "\">" + n.date + "</time>" : "";
    return "<li class=\"news-item\">" + d + "<span class=\"news-text\">" + n.text + "</span></li>";
  }).join("");
})();
