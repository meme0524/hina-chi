(function () {
  var widget = document.getElementById("yt-live");
  if (!widget || typeof YOUTUBE === "undefined") return;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function isSafeVideoId(id) {
    return typeof id === "string" && /^[A-Za-z0-9_-]{6,}$/.test(id);
  }

  function videoIdFromOembed(data) {
    var html = data && data.html ? String(data.html) : "";
    var fromEmbed = html.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
    if (fromEmbed) return fromEmbed[1];
    var thumb = data && data.thumbnail_url ? String(data.thumbnail_url) : "";
    var fromThumb = thumb.match(/\/vi\/([A-Za-z0-9_-]{6,})\//);
    return fromThumb ? fromThumb[1] : "";
  }

  function oembedUrls() {
    var urls = [];
    if (YOUTUBE.handle) {
      urls.push("https://www.youtube.com/oembed?format=json&url=" +
        encodeURIComponent("https://www.youtube.com/@" + YOUTUBE.handle.replace(/^@/, "") + "/live"));
    }
    if (YOUTUBE.channelId) {
      urls.push("https://www.youtube.com/oembed?format=json&url=" +
        encodeURIComponent("https://www.youtube.com/channel/" + YOUTUBE.channelId + "/live"));
    }
    return urls;
  }

  function fetchLive(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    });
  }

  function firstLive(urls, index) {
    if (index >= urls.length) return Promise.reject(new Error("offline"));
    return fetchLive(urls[index]).catch(function () {
      return firstLive(urls, index + 1);
    });
  }

  function hide() {
    widget.hidden = true;
    widget.innerHTML = "";
  }

  function show(data) {
    var videoId = videoIdFromOembed(data);
    var title = data.title ? String(data.title) : "YouTube で配信中";
    var watchUrl = isSafeVideoId(videoId)
      ? "https://www.youtube.com/watch?v=" + videoId
      : (YOUTUBE.channelUrl || "https://www.youtube.com/@" + (YOUTUBE.handle || ""));
    var embed = isSafeVideoId(videoId)
      ? "<div class=\"yt-live-frame\">" +
        "<iframe src=\"https://www.youtube-nocookie.com/embed/" + videoId + "\" title=\"" + escapeHtml(title) + "\" " +
        "allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" " +
        "allowfullscreen loading=\"lazy\"></iframe></div>"
      : "";

    widget.innerHTML = [
      "<div class=\"container\">",
      "  <div class=\"yt-live-card\">",
      embed,
      "    <div class=\"yt-live-body\">",
      "      <p class=\"yt-live-label\"><span class=\"yt-live-dot\" aria-hidden=\"true\"></span>YouTube 配信中</p>",
      "      <p class=\"yt-live-title\">" + escapeHtml(title) + "</p>",
      "      <a class=\"btn btn-primary\" href=\"" + escapeHtml(watchUrl) + "\" target=\"_blank\" rel=\"noopener\">YouTube で見る</a>",
      "    </div>",
      "  </div>",
      "</div>"
    ].join("\n");
    widget.hidden = false;
  }

  function check() {
    var urls = oembedUrls();
    if (urls.length === 0) {
      hide();
      return;
    }
    firstLive(urls, 0).then(show).catch(hide);
  }

  check();
  setInterval(check, 5 * 60 * 1000);
})();
