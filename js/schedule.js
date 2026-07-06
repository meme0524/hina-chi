(function () {
  var WEEKEND_START = 21 * 60;
  var WEEKEND_END = 24 * 60;

  function getJSTDate() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function addDays(date, days) {
    var next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function isWeekend(date) {
    var d = date.getDay();
    return d === 0 || d === 6;
  }

  function dayLabel(date, now) {
    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    ) {
      return "今日";
    }

    var tomorrow = addDays(now, 1);
    if (
      date.getFullYear() === tomorrow.getFullYear() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getDate() === tomorrow.getDate()
    ) {
      return "明日";
    }

    return (date.getMonth() + 1) + "月" + date.getDate() + "日";
  }

  function nextWeekendDate(now) {
    for (var i = 0; i <= 7; i++) {
      var d = addDays(now, i);
      if (isWeekend(d)) {
        if (i === 0) {
          var minutes = now.getHours() * 60 + now.getMinutes();
          if (minutes >= WEEKEND_END) continue;
        }
        return d;
      }
    }
    return now;
  }

  function getNextStreamMessage(now) {
    var minutes = now.getHours() * 60 + now.getMinutes();
    var weekend = isWeekend(now);

    if (weekend && minutes >= WEEKEND_START && minutes < WEEKEND_END) {
      return {
        text: "いま週末枠の時間帯です（21:00〜）。REALITY をチェック！",
        live: true
      };
    }

    if (!weekend) {
      return {
        text: "平日は不定期配信。告知は X（@Hina_nachi）をチェック！",
        live: false
      };
    }

    var target = nextWeekendDate(now);
    return {
      text: "次の週末枠：" + dayLabel(target, now) + " 21:00〜（REALITY）",
      live: false
    };
  }

  function updateNextStream() {
    var el = document.getElementById("next-stream-text");
    var box = document.getElementById("next-stream");
    if (!el || !box) return;

    var now = getJSTDate();
    var result = getNextStreamMessage(now);

    el.textContent = result.text;
    box.classList.toggle("next-stream-live", result.live);
  }

  updateNextStream();
  setInterval(updateNextStream, 60 * 1000);
})();
