(function () {
  var PAGE_SIZE = 6;

  var list       = document.getElementById("post-list");
  var filterWrap = document.getElementById("tag-filter");
  var noResults  = document.getElementById("no-results");
  var loadMore   = document.getElementById("load-more");
  if (!list) return;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ファイルパスは英数記号のみ許可（ディレクトリトラバーサル等を防ぐ）
  function isSafePath(p) {
    return typeof p === "string" && /^[A-Za-z0-9_./-]+$/.test(p) && p.indexOf("..") === -1;
  }

  var items = (typeof POSTS !== "undefined" ? POSTS : []).filter(function (p) { return p && p.title; });

  if (items.length === 0) {
    list.innerHTML = "<li class=\"blog-empty\">まだ記事がありません。</li>";
    return;
  }

  var currentTag    = null; // null = すべて
  var renderedCount = PAGE_SIZE;
  var firstRender   = true;

  // 全タグ収集（重複除去・出現順）
  var allTags = [];
  items.forEach(function (p) {
    (p.tags || []).forEach(function (t) {
      if (allTags.indexOf(t) === -1) allTags.push(t);
    });
  });

  // タグフィルターボタン生成
  if (allTags.length > 0) {
    var btns = ["すべて"].concat(allTags).map(function (tag) {
      var btn = document.createElement("button");
      btn.className = "tag-btn";
      btn.textContent = tag;
      btn.setAttribute("aria-pressed", tag === "すべて" ? "true" : "false");
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tag-btn").forEach(function (b) {
          b.setAttribute("aria-pressed", "false");
        });
        btn.setAttribute("aria-pressed", "true");
        currentTag    = (tag === "すべて") ? null : tag;
        renderedCount = PAGE_SIZE;
        render();
      });
      return btn;
    });
    btns.forEach(function (b) { filterWrap.appendChild(b); });
  }

  function getFiltered() {
    if (!currentTag) return items;
    return items.filter(function (p) {
      return (p.tags || []).indexOf(currentTag) !== -1;
    });
  }

  function renderItem(p) {
    var safeTags = (p.tags || []).map(escapeHtml);
    var tagsHtml = safeTags.length
      ? "<div class=\"post-tags\">" + safeTags.map(function (t) {
          return "<span class=\"post-tag\">" + t + "</span>";
        }).join("") + "</div>"
      : "";

    var dataFile = escapeHtml(p.file || "");
    var title    = escapeHtml(p.title);
    var date     = escapeHtml(p.date || "");

    return [
      "<li class=\"post-item\" data-file=\"" + dataFile + "\">",
      "  <details>",
      "    <summary class=\"post-toggle\">",
      "      <span class=\"post-date\">" + date + "</span>",
      "      <span class=\"post-title\">" + title + "</span>",
      "      <span class=\"post-arrow\">▶</span>",
      "    </summary>",
      "    <div class=\"post-body\">" + tagsHtml + "<div class=\"post-md\"><p class=\"post-loading\">読み込み中…</p></div></div>",
      "  </details>",
      "</li>"
    ].join("\n");
  }

  // 現在のタグ・ページ数に応じて表示中の分だけ描画（記事が増えても初期描画は軽いまま）
  function render() {
    var filtered = getFiltered();
    var visible  = filtered.slice(0, renderedCount);

    if (visible.length === 0) {
      list.innerHTML = "";
      noResults.hidden = false;
      loadMore.hidden = true;
      return;
    }

    noResults.hidden = true;
    list.innerHTML = visible.map(renderItem).join("\n");

    loadMore.hidden = renderedCount >= filtered.length;

    // 初回表示時だけ、一番新しい記事を開いておく
    if (firstRender) {
      var firstDetails = list.querySelector("details");
      if (firstDetails) {
        firstDetails.open = true;
        firstDetails.dispatchEvent(new Event("toggle", { bubbles: true }));
      }
      firstRender = false;
    }
  }

  loadMore.addEventListener("click", function () {
    renderedCount += PAGE_SIZE;
    render();
  });

  // details を開いたときに .md を fetch してレンダリング（本文は開くまで読み込まない）
  list.addEventListener("toggle", function (e) {
    var details = e.target;
    if (details.tagName !== "DETAILS" || !details.open) return;
    var li   = details.closest(".post-item");
    var mdEl = details.querySelector(".post-md");
    if (!li || !mdEl || mdEl.dataset.loaded) return;

    var file = li.getAttribute("data-file");
    if (!file) {
      mdEl.innerHTML = "<p>（本文なし）</p>";
      mdEl.dataset.loaded = "1";
      return;
    }

    if (!isSafePath(file)) {
      mdEl.innerHTML = "<p class=\"post-loading\">記事パスが不正です。</p>";
      mdEl.dataset.loaded = "1";
      return;
    }

    fetch(file)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then(function (md) {
        var html = marked.parse(md);
        // Markdown由来のHTMLはDOMPurifyでサニタイズしてからDOMに挿入する
        mdEl.innerHTML = DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
        });
        mdEl.dataset.loaded = "1";
      })
      .catch(function () {
        mdEl.innerHTML = "<p class=\"post-loading\">記事の読み込みに失敗しました。</p>";
      });
  }, true);

  render();
})();
