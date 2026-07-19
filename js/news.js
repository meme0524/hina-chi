(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderNews() {
    var list = document.getElementById("news-list");
    if (!list) return;

    if (typeof NEWS === "undefined") {
      list.innerHTML = "<li class=\"news-empty\">お知らせを読み込めませんでした</li>";
      return;
    }

    var items = NEWS.filter(function (n) { return n && n.text; });
    if (items.length === 0) {
      list.innerHTML = "<li class=\"news-empty\">お知らせはありません</li>";
      return;
    }

    list.innerHTML = items.map(function (n) {
      var date = escapeHtml(n.date || "");
      var text = escapeHtml(n.text);
      var d = n.date ? "<time class=\"news-date\" datetime=\"" + date + "\">" + date + "</time>" : "";
      return "<li class=\"news-item\">" + d + "<span class=\"news-text\">" + text + "</span></li>";
    }).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderNews);
  } else {
    renderNews();
  }
})();
