import { SCHEDULE_REGULAR, SCHEDULE_SPECIALS } from "../data/schedule.js";

(function () {
  var DOW = ["日", "月", "火", "水", "木", "金", "土"];
  var DEFAULT_END = "24:00";
  var viewYear = 0;
  var viewMonth = 0;

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

  function dayLabel(date, now) {
    if (dateKey(date) === dateKey(now)) return "今日";
    if (dateKey(date) === dateKey(addDays(now, 1))) return "明日";
    return formatMonthDay(date);
  }

  function getRegular() {
    return (SCHEDULE_REGULAR || []).filter(function (s) {
      return s && s.label && Array.isArray(s.days) && s.days.length > 0;
    });
  }

  function getSpecials() {
    return (SCHEDULE_SPECIALS || []).map(function (s) {
      if (!s || !s.title) return null;
      var start = s.startDate || s.date;
      if (!start) return null;
      var end = s.endDate || start;
      if (end < start) end = start;
      return {
        date: start,
        endDate: end > start ? end : "",
        type: s.type || "",
        title: String(s.title).trim(),
        time: s.time || "",
      };
    }).filter(function (s) { return s; });
  }

  function getStreams() {
    var list = window.__SCHEDULE_STREAMS__;
    if (!Array.isArray(list)) return [];
    return list.filter(function (s) {
      return s && s.date && s.title;
    }).map(function (s) {
      return {
        date: s.date,
        title: String(s.title).trim(),
        time: s.time || "",
      };
    });
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
    if (end <= start) return minutes >= start || minutes < end;
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

  function parseDateKey(key) {
    var p = String(key).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function compareDated(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    var byTime = (a.time || "").localeCompare(b.time || "");
    if (byTime !== 0) return byTime;
    return (a.endDate || "").localeCompare(b.endDate || "");
  }

  function nextDatedItem(items, now) {
    var today = dateKey(now);
    var minutes = now.getHours() * 60 + now.getMinutes();
    var end = parseMinutes(DEFAULT_END);
    var upcoming = items.filter(function (s) {
      return s && s.date && s.title && (s.endDate || s.date) >= today;
    }).sort(compareDated);

    for (var i = 0; i < upcoming.length; i++) {
      var s = upcoming[i];
      if (s.endDate && s.endDate > s.date) continue;
      if (s.date > today) return { item: s, live: false };
      var start = parseMinutes(s.time);
      if (start != null && minutes >= start && (end == null || minutes < end)) {
        return { item: s, live: true };
      }
      if (start == null || minutes < start) return { item: s, live: false };
    }
    return null;
  }

  function getNextStreamMessage(now, regular, specials, streams) {
    var today = dateKey(now);
    var dated = nextDatedItem(streams.concat(specials), now);
    if (dated) {
      var item = dated.item;
      var timeText = item.time ? " " + item.time + "〜" : "";
      if (dated.live && item.date === today) {
        return { text: "いま配信中：" + item.title + timeText, live: true };
      }
      if (item.date === today) {
        return { text: "今日：" + item.title + timeText, live: false };
      }
      return {
        text: "次の配信：" + dayLabel(parseDateKey(item.date), now) + timeText + " " + item.title,
        live: false,
      };
    }

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
        live: true,
      };
    }

    var next = nextRegularDate(now, regular);
    if (next) {
      return {
        text: "次の定例枠：" + dayLabel(next.date, now) + " " + next.slot.start + "〜（REALITY）",
        live: false,
      };
    }

    return { text: "告知は X（@Hina_nachi）をチェック！", live: false };
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
        "</article>",
      ].join("\n");
    }).join("\n");
  }

  function coversDate(item, key) {
    if (!item || !item.date || !item.title) return false;
    var end = item.endDate || item.date;
    return item.date <= key && end >= key;
  }

  function eventLabel(item) {
    var title = String(item.title).trim();
    return item.time ? item.time + " " + title : title;
  }

  function eventTitle(item) {
    var label = eventLabel(item);
    if (item.endDate && item.endDate > item.date) {
      return label + "（" + item.date + "〜" + item.endDate + "）";
    }
    return label;
  }

  function renderCalendar(items, today) {
    var label = document.getElementById("schedule-cal-label");
    var grid = document.getElementById("schedule-calendar-grid");
    if (!grid || !viewYear || !viewMonth) return;
    if (label) label.textContent = viewYear + "年 " + viewMonth + "月";

    var first = new Date(viewYear, viewMonth - 1, 1);
    var lead = (first.getDay() + 6) % 7;
    var count = new Date(viewYear, viewMonth, 0).getDate();
    var cells = lead + count;
    var tail = (7 - (cells % 7)) % 7;
    var html = [];

    for (var blank = 0; blank < lead; blank++) {
      html.push("<div class=\"schedule-cal-day is-pad\" aria-hidden=\"true\"></div>");
    }

    for (var day = 1; day <= count; day++) {
      var date = new Date(viewYear, viewMonth - 1, day);
      var key = dateKey(date);
      var dow = date.getDay();
      var classes = ["schedule-cal-day"];
      if (dow === 6) classes.push("is-sat");
      if (dow === 0) classes.push("is-sun");
      if (key === today) classes.push("is-today");
      var dayItems = items.filter(function (item) { return coversDate(item, key); }).sort(compareDated);
      var labels = dayItems.map(eventLabel);
      var events = dayItems.map(function (item) {
        var text = eventLabel(item);
        var span = item.endDate && item.endDate > item.date;
        var cls = "schedule-cal-event" + (span ? " is-span" : "");
        return "<p class=\"" + cls + "\" title=\"" + escapeHtml(eventTitle(item)) + "\">" + escapeHtml(text) + "</p>";
      }).join("");
      var aria = viewMonth + "月" + day + "日" + (labels.length ? "、" + labels.join("、") : "");
      html.push(
        "<div class=\"" + classes.join(" ") + "\" role=\"gridcell\" aria-label=\"" + escapeHtml(aria) + "\">" +
          "<span class=\"schedule-cal-num\">" + day + "</span>" +
          events +
        "</div>"
      );
    }

    for (var pad = 0; pad < tail; pad++) {
      html.push("<div class=\"schedule-cal-day is-pad\" aria-hidden=\"true\"></div>");
    }

    grid.innerHTML = html.join("");
  }

  function shiftMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 1) {
      viewMonth = 12;
      viewYear -= 1;
    } else if (viewMonth > 12) {
      viewMonth = 1;
      viewYear += 1;
    }
  }

  function updateNextStream(now, regular, specials, streams) {
    var el = document.getElementById("next-stream-text");
    var box = document.getElementById("next-stream");
    if (!el || !box) return;
    var result = getNextStreamMessage(now, regular, specials, streams);
    el.textContent = result.text;
    box.classList.toggle("next-stream-live", result.live);
  }

  function paintCalendar() {
    var now = getJSTDate();
    renderCalendar(getSpecials().concat(getStreams()), dateKey(now));
  }

  function init() {
    var regular = getRegular();
    var specials = getSpecials();
    var streams = getStreams();
    var now = getJSTDate();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth() + 1;
    renderRegular(regular);
    paintCalendar();
    updateNextStream(now, regular, specials, streams);

    var prev = document.getElementById("schedule-cal-prev");
    var next = document.getElementById("schedule-cal-next");
    if (prev) {
      prev.addEventListener("click", function () {
        shiftMonth(-1);
        paintCalendar();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        shiftMonth(1);
        paintCalendar();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  setInterval(function () {
    updateNextStream(getJSTDate(), getRegular(), getSpecials(), getStreams());
  }, 60 * 1000);
})();
