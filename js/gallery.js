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

  function getItemType(g) {
    return g.type === "screenshot" ? "screenshot" : "fanart";
  }

  function getAllItems() {
    return GALLERY.filter(function (g) { return g && g.src; });
  }

  function getPreviewItems() {
    var items = getAllItems();
    var fanart = items.filter(function (g) { return getItemType(g) === "fanart"; });
    var screenshots = items.filter(function (g) { return getItemType(g) === "screenshot"; });
    return shuffle(pickRandom(fanart, 2).concat(pickRandom(screenshots, 2)));
  }

  function filterByType(items, filter) {
    if (filter === "fanart") {
      return items.filter(function (g) { return getItemType(g) === "fanart"; });
    }
    if (filter === "screenshot") {
      return items.filter(function (g) { return getItemType(g) === "screenshot"; });
    }
    return items;
  }

  function renderItem(g) {
    var src = escapeHtml(base + g.src);
    var alt = escapeHtml(g.alt || "ギャラリー画像");
    var type = getItemType(g);
    var caption = g.caption ? escapeHtml(g.caption) : "";
    var url = g.url ? escapeHtml(g.url) : "";
    var label = TYPE_LABELS[type] || TYPE_LABELS.fanart;

    var img = "<img src=\"" + src + "\" alt=\"" + alt + "\" loading=\"lazy\">";
    var thumbInner;
    if (type === "screenshot") {
      var captionAttr = caption ? " data-caption=\"" + caption + "\"" : "";
      thumbInner = "<button type=\"button\" class=\"gallery-zoom\" data-src=\"" + src + "\" data-alt=\"" + alt + "\"" + captionAttr + " aria-label=\"" + alt + " を拡大表示\">" + img + "</button>";
    } else if (url) {
      thumbInner = "<a href=\"" + url + "\" class=\"gallery-link\" target=\"_blank\" rel=\"noopener\">" + img + "</a>";
    } else {
      thumbInner = img;
    }

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

  function renderGrid(items) {
    if (items.length === 0) {
      grid.innerHTML = "<p class=\"gallery-empty\">該当する画像はありません。</p>";
      return;
    }
    grid.innerHTML = items.map(renderItem).join("\n");
  }

  function initGalleryFilter(allItems) {
    var filterWrap = document.getElementById("gallery-filter");
    if (!filterWrap) return;

    function setActiveButton(filter) {
      filterWrap.querySelectorAll(".gallery-filter-btn").forEach(function (btn) {
        var active = btn.getAttribute("data-filter") === filter;
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function applyFilter(filter, updateHash) {
      setActiveButton(filter);
      renderGrid(filterByType(allItems, filter));
      if (updateHash === false) return;
      var nextUrl = filter === "all"
        ? location.pathname
        : location.pathname + "#" + filter;
      history.replaceState(null, "", nextUrl);
    }

    filterWrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".gallery-filter-btn");
      if (!btn) return;
      applyFilter(btn.getAttribute("data-filter"));
    });

    window.addEventListener("hashchange", function () {
      var hash = location.hash.replace("#", "");
      if (hash === "fanart" || hash === "screenshot") applyFilter(hash, false);
      else applyFilter("all", false);
    });

    var initial = location.hash.replace("#", "");
    if (initial === "fanart" || initial === "screenshot") applyFilter(initial, false);
    else applyFilter("all", false);
  }

  var allItems = getAllItems();
  if (allItems.length === 0) return;

  if (mode === "preview") {
    renderGrid(getPreviewItems());
  } else {
    initGalleryFilter(allItems);
  }

  initScreenshotLightbox(grid);
})();

function initScreenshotLightbox(grid) {
  if (grid._lightboxBound) return;
  grid._lightboxBound = true;

  var lightbox = document.getElementById("gallery-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "gallery-lightbox";
    lightbox.className = "gallery-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "画像を拡大表示");
    lightbox.innerHTML = [
      "<div class=\"gallery-lightbox-backdrop\" data-lightbox-close></div>",
      "<div class=\"gallery-lightbox-panel\">",
      "  <button type=\"button\" class=\"gallery-lightbox-close\" data-lightbox-close aria-label=\"閉じる\">×</button>",
      "  <figure class=\"gallery-lightbox-figure\">",
      "    <img class=\"gallery-lightbox-img\" src=\"\" alt=\"\">",
      "    <figcaption class=\"gallery-lightbox-caption\"></figcaption>",
      "  </figure>",
      "</div>"
    ].join("");
    document.body.appendChild(lightbox);

    lightbox.addEventListener("click", function (e) {
      if (e.target.closest("[data-lightbox-close]")) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }

  var lightboxImg = lightbox.querySelector(".gallery-lightbox-img");
  var lightboxCaption = lightbox.querySelector(".gallery-lightbox-caption");
  var lastFocus = null;

  function openLightbox(src, alt, caption) {
    lastFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    if (caption) {
      lightboxCaption.textContent = caption;
      lightboxCaption.hidden = false;
    } else {
      lightboxCaption.textContent = "";
      lightboxCaption.hidden = true;
    }
    lightbox.hidden = false;
    document.body.classList.add("gallery-lightbox-open");
    lightbox.querySelector(".gallery-lightbox-close").focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.removeAttribute("src");
    document.body.classList.remove("gallery-lightbox-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".gallery-zoom");
    if (!btn) return;
    openLightbox(btn.getAttribute("data-src"), btn.getAttribute("data-alt"), btn.getAttribute("data-caption") || "");
  });
}
