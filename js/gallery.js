(function () {
  var grid = document.getElementById("gallery-grid");
  if (!grid || typeof GALLERY === "undefined") return;

  var mode = grid.getAttribute("data-gallery-mode") || "all";
  var base = grid.getAttribute("data-gallery-base") || "";
  var TYPE_LABELS = {
    fanart: "Fan Art",
    screenshot: "Screenshot"
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function pickRandom(arr, count) {
    return shuffle(arr).slice(0, Math.min(count, arr.length));
  }

  function getItems() {
    var items = GALLERY.filter(function (g) { return g && g.src; });
    if (mode !== "preview") return items;

    var fanart = items.filter(function (g) { return g.type !== "screenshot"; });
    var screenshots = items.filter(function (g) { return g.type === "screenshot"; });
    return shuffle(pickRandom(fanart, 2).concat(pickRandom(screenshots, 2)));
  }

  function renderItem(g) {
    var src = escapeHtml(base + g.src);
    var alt = escapeHtml(g.alt || "ギャラリー画像");
    var type = g.type === "screenshot" ? "screenshot" : "fanart";
    var caption = g.caption ? escapeHtml(g.caption) : "";
    var url = g.url ? escapeHtml(g.url) : "";
    var label = TYPE_LABELS[type] || TYPE_LABELS.fanart;

    var img = "<img src=\"" + src + "\" alt=\"" + alt + "\" loading=\"lazy\">";
    var thumbInner = url
      ? "<a href=\"" + url + "\" class=\"gallery-link\" target=\"_blank\" rel=\"noopener\">" + img + "</a>"
      : img;

    var badge = "<span class=\"gallery-badge gallery-badge-" + type + "\">" + label + "</span>";

    var captionHtml = "";
    if (caption) {
      captionHtml = url
        ? "<a href=\"" + url + "\" class=\"gallery-caption-text\" target=\"_blank\" rel=\"noopener\">" + caption + "</a>"
        : "<span class=\"gallery-caption-text\">" + caption + "</span>";
    }

    return [
      "<figure class=\"gallery-item gallery-item-" + type + "\">",
      "  <div class=\"gallery-thumb\">" + badge + thumbInner + "</div>",
      captionHtml ? "  <figcaption class=\"gallery-caption\">" + captionHtml + "</figcaption>" : "",
      "</figure>"
    ].join("\n");
  }

  var items = getItems();
  if (items.length === 0) return;

  grid.innerHTML = items.map(renderItem).join("\n");
})();
