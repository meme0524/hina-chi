(function () {
  var container = document.getElementById("post-content");
  if (!container) return;

  // ファイルパスは英数記号のみ許可（ディレクトリトラバーサル等を防ぐ）
  function isSafePath(p) {
    return typeof p === "string" && /^[A-Za-z0-9_./-]+$/.test(p) && p.indexOf("..") === -1;
  }

  var file = container.getAttribute("data-file");
  if (!file || !isSafePath(file)) {
    container.innerHTML = "<p class=\"post-loading\">記事を読み込めませんでした。</p>";
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
      container.innerHTML = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
      });
    })
    .catch(function () {
      container.innerHTML = "<p class=\"post-loading\">記事の読み込みに失敗しました。</p>";
    });
})();
