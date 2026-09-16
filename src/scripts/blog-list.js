(function () {
  var PAGE_SIZE = 6;
  var list = document.getElementById("post-list");
  var filterWrap = document.getElementById("tag-filter");
  var noResults = document.getElementById("no-results");
  var loadMore = document.getElementById("load-more");
  if (!list || !filterWrap || !loadMore) return;

  var currentTag = "";
  var renderedCount = PAGE_SIZE;

  function items() {
    return Array.prototype.slice.call(list.querySelectorAll(".post-item"));
  }

  function apply() {
    var all = items();
    var filtered = all.filter(function (li) {
      if (!currentTag) return true;
      return (li.getAttribute("data-tags") || "").split(",").indexOf(currentTag) !== -1;
    });

    all.forEach(function (li) { li.hidden = true; });
    filtered.slice(0, renderedCount).forEach(function (li) { li.hidden = false; });

    if (noResults) noResults.hidden = filtered.length > 0;
    loadMore.hidden = renderedCount >= filtered.length;
  }

  filterWrap.addEventListener("click", function (e) {
    var btn = e.target.closest(".tag-btn");
    if (!btn) return;
    filterWrap.querySelectorAll(".tag-btn").forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    btn.setAttribute("aria-pressed", "true");
    currentTag = btn.getAttribute("data-tag") || "";
    renderedCount = PAGE_SIZE;
    apply();
  });

  loadMore.addEventListener("click", function () {
    renderedCount += PAGE_SIZE;
    apply();
  });

  list.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".post-permalink")) {
      e.stopPropagation();
    }
  }, true);

  apply();
})();
