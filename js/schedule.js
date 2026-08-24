(function () {
  var DOW = ["日", "月", "火", "水", "木", "金", "土"];
  var TYPE_LABELS = {
    collab: "コラボ",
    event: "イベント",
    extra: "特別"
  };
  var DEFAULT_END = "24:00";

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function getJSTDate() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  }

  function addDays(date, days) {
    var next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function dateKey(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function parseMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== "string") return null;
    var m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function formatMonthDay(date) {
    return (date.getMonth() + 1) + "/" + date.getDate() + "（" + DOW[date.getDay()] + "）";
  }

  function formatKey(key) {
    var p = String(key).split("-");
    if (p.length !== 3) return escapeHtml(key);
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return formatMonthDay(d);
  }

  function dayLabel(date, now) {
    if (dateKey(date) === dateKey(now)) return "今日";
    if (dateKey(date) === dateKey(addDays(now, 1))) return "明日";
    return formatMonthDay(date);
  }

  function getRegular() {
    if (typeof SCHEDULE_REGULAR === "undefined" || !Array.isArray(SCHEDULE_REGULAR)) return [];
    return SCHEDULE_REGULAR.filter(function (s) {
      return s && s.label && Array.isArray(s.days) && s.days.length > 0;
    });
  }

  function getSpecials() {
    if (typeof SCHEDULE_SPECIALS === "undefined" || !Array.isArray(SCHEDULE_SPECIALS)) return [];
    return SCHEDULE_SPECIALS.filter(function (s) { return s && s.date && s.title; });
  }

  function isActiveSpecial(s, today) {
    var end = s.endDate || s.date;
    return end >= today;
  }

  function slotForDay(regular, day) {
    for (var i = 0; i < regular.length; i++) {
      if (regular[i].days.indexOf(day) !== -1) return regular[i];
    }
    return null;
  }

  function isLiveNow(now, slot) {
    if (!slot || !slot.start) return false;
    var start = parseMinutes(slot.start);
    var end = parseMinutes(slot.end || DEFAULT_END);
    if (start == null || end == null) return false;
    var minutes = now.getHours() * 60 + now.getMinutes();
    if (end <= start) {
      return minutes >= start || minutes < end;
    }
    return minutes >= start && minutes < end;
  }

  function nextRegularDate(now, regular) {
    for (var i = 0; i <= 7; i++) {
      var d = addDays(now, i);
      var slot = slotForDay(regular, d.getDay());
      if (!slot || !slot.start) continue;
      if (i === 0 && !isLiveNow(now, slot)) {
        var start = parseMinutes(slot.start);
        var minutes = now.getHours() * 60 + now.getMinutes();
        if (start == null || minutes >= start) continue;
      }
      if (i === 0 && isLiveNow(now, slot)) continue;
      return { date: d, slot: slot };
    }
    return null;
  }

  function todaysCollab(specials, today) {
    for (var i = 0; i < specials.length; i++) {
      var s = specials[i];
      if (s.endDate) continue;
      if (s.date === today && (s.type || "collab") !== "event") return s;
    }
    return null;
  }

  function getNextStreamMessage(now, regular, specials) {
    var today = dateKey(now);
    var slot = slotForDay(regular, now.getDay());
    var collab = todaysCollab(specials, today);

    if (collab) {
      var liveNow = slot && isLiveNow(now, slot);
      var collabText = (liveNow ? "いま配信中：" : "今日：") + collab.title;
      if (collab.time) collabText += " " + collab.time + "〜";
      return { text: collabText, live: !!liveNow };
    }

    if (slot && isLiveNow(now, slot)) {
      return {
        text: "いま定例枠の時間帯です（" + slot.start + "〜）。REALITY をチェック！",
        live: true
      };
    }

    var next = nextRegularDate(now, regular);
    if (next) {
      return {
        text: "次の定例枠：" + dayLabel(next.date, now) + " " + next.slot.start + "〜（REALITY）",
        live: false
      };
    }

    return {
      text: "告知は X（@Hina_nachi）をチェック！",
      live: false
    };
  }

  function renderRegular(regular) {
    var grid = document.getElementById("schedule-regular");
    if (!grid) return;

    if (regular.length === 0) {
      grid.innerHTML = "";
      return;
    }

    grid.innerHTML = regular.map(function (s) {
      var timed = !!s.start;
      var cardClass = timed ? "schedule-card schedule-card-main" : "schedule-card schedule-card-guerrilla";
      var timeText = timed ? escapeHtml(s.start) + " 〜" : "不定期";
      var desc = s.desc ? "<p class=\"schedule-card-desc\">" + escapeHtml(s.desc) + "</p>" : "";
      return [
        "<article class=\"" + cardClass + "\">",
        "  <p class=\"schedule-card-label\">" + escapeHtml(s.label) + "</p>",
        "  <p class=\"schedule-card-time\">" + timeText + "</p>",
        desc,
        "</article>"
      ].join("\n");
    }).join("\n");
  }

  function renderSpecials(specials, today) {
    var heading = document.getElementById("schedule-specials-heading");
    var list = document.getElementById("schedule-specials");
    if (!list) return;

    var upcoming = specials.filter(function (s) { return isActiveSpecial(s, today); });
    upcoming.sort(function (a, b) {
      if (a.date === b.date) return (a.endDate || "").localeCompare(b.endDate || "");
      return a.date.localeCompare(b.date);
    });

    if (upcoming.length === 0) {
      list.innerHTML = "";
      if (heading) heading.hidden = true;
      return;
    }

    if (heading) heading.hidden = false;
    list.innerHTML = upcoming.map(function (s) {
      var type = s.type && TYPE_LABELS[s.type] ? s.type : "collab";
      var badge = "<span class=\"schedule-special-badge schedule-special-badge-" + type + "\">" + TYPE_LABELS[type] + "</span>";
      var dateLabel = s.endDate
        ? formatKey(s.date) + "〜" + formatKey(s.endDate)
        : formatKey(s.date);
      var dateAttr = escapeHtml(s.date);
      var time = s.time ? "<span class=\"schedule-special-time\">" + escapeHtml(s.time) + "〜</span>" : "";
      var desc = s.desc ? "<p class=\"schedule-special-desc\">" + escapeHtml(s.desc) + "</p>" : "";
      var ongoing = s.endDate && s.date <= today && s.endDate >= today
        ? "<span class=\"schedule-special-now\">開催中</span>"
        : "";

      return [
        "<li class=\"schedule-special-item\">",
        "  <time class=\"schedule-special-date\" datetime=\"" + dateAttr + "\">" + dateLabel + "</time>",
        "  " + badge,
        "  <div class=\"schedule-special-body\">",
        "    <p class=\"schedule-special-title\">" + ongoing + escapeHtml(s.title) + time + "</p>",
        desc,
        "  </div>",
        "</li>"
      ].join("\n");
    }).join("\n");
  }

  function updateNextStream(now, regular, specials) {
    var el = document.getElementById("next-stream-text");
    var box = document.getElementById("next-stream");
    if (!el || !box) return;

    var result = getNextStreamMessage(now, regular, specials);
    el.textContent = result.text;
    box.classList.toggle("next-stream-live", result.live);
  }

  function init() {
    var regular = getRegular();
    var specials = getSpecials();
    var now = getJSTDate();

    renderRegular(regular);
    renderSpecials(specials, dateKey(now));
    updateNextStream(now, regular, specials);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  setInterval(function () {
    var regular = getRegular();
    var specials = getSpecials();
    updateNextStream(getJSTDate(), regular, specials);
  }, 60 * 1000);
})();
