(function () {
  var MAX_EVENTS = 3;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderEvent(e) {
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
  }

  function renderEvents() {
    var list = document.getElementById("events-list");
    if (!list) return;

    if (typeof EVENTS === "undefined") {
      list.innerHTML = "<li class=\"news-empty\">イベント情報を読み込めませんでした</li>";
      return;
    }

    var items = EVENTS.filter(function (e) { return e && e.title; });
    if (items.length === 0) {
      list.innerHTML = "<li class=\"news-empty\">イベント情報はありません</li>";
      return;
    }

    var mode = list.getAttribute("data-events-mode") || "all";
    var visible = mode === "preview" ? items.slice(0, MAX_EVENTS) : items;
    list.innerHTML = visible.map(renderEvent).join("\n");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderEvents);
  } else {
    renderEvents();
  }
})();
