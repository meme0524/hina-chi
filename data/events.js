// ======================================
//  イベント実績を書き込む場所
//  新しいものを上に追加してください
// ======================================
var EVENTS = [
  {
    date: "2026-05",          // 年月（表示用）
    label: "REALITY",         // バッジに表示するプラットフォーム名
    title: "2025年11月開始の方限定！ グランプリ決定戦！ 6位",
    desc: "新宿ポスターにアイコン掲載決定！！入賞は惜しくも逃したけど、楽しい１週間でした！"
  },
  {
    date: "2026-02",
    label: "REALITY",
    title: "ルーキーグランプリ 5位",
    desc: "5位入賞！！みんなの応援のおかげで手にできた結果です、ありがとう！"
  },
];

// ---- 以下は触らなくてOK ----
(function () {
  var list = document.getElementById("events-list");
  if (!list) return;

  var items = EVENTS.filter(function (e) { return e && e.title; });
  if (items.length === 0) {
    list.innerHTML = "<li class=\"news-empty\">イベント情報はありません</li>";
    return;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  list.innerHTML = items.map(function (e) {
    var rawDate = e.date || "";
    var display = escapeHtml(rawDate.replace("-", "."));
    var dateAttr = escapeHtml(rawDate);
    var title = escapeHtml(e.title);
    var desc = e.desc ? escapeHtml(e.desc) : "";
    var label = e.label ? escapeHtml(e.label) : "";

    var datePart = rawDate
      ? "<time class=\"event-date\" datetime=\"" + dateAttr + "\">" + display + "</time>"
      : "";
    var badge = label
      ? "<span class=\"event-badge event-badge-online\">" + label + "</span>"
      : "";
    return [
      "<li class=\"event-item\">",
      "  <div class=\"event-meta\">" + datePart + badge + "</div>",
      "  <div class=\"event-body\">",
      "    <h3 class=\"event-title\">" + title + "</h3>",
      desc ? "    <p class=\"event-desc\">" + desc + "</p>" : "",
      "  </div>",
      "</li>"
    ].join("\n");
  }).join("\n");
})();
