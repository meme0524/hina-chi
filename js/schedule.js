(function () {
  var MAIN_START = 21 * 60;
  var MAIN_END = 22 * 60;
  var GUERRILLA_START = 23 * 60 + 30;

  function getJSTDate() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatTime(h, m) {
    return pad(h) + ":" + pad(m);
  }

  function addDays(date, days) {
    var next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
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

  function getNextStreamMessage(now) {
    var minutes = now.getHours() * 60 + now.getMinutes();

    if (minutes >= MAIN_START && minutes < MAIN_END) {
      return {
        text: "いまメイン枠の時間帯です（21:00〜22:00）。REALITY をチェック！",
        live: true
      };
    }

    if (minutes >= GUERRILLA_START || minutes < MAIN_START) {
      if (minutes >= GUERRILLA_START) {
        return {
          text: "ゲリラ枠の時間帯です（23:30〜・不定期）。REALITY または X をチェック！",
          live: true
        };
      }

      return {
        text: "次のメイン枠：" + dayLabel(now, now) + " 21:00（REALITY）",
        live: false
      };
    }

    if (minutes >= MAIN_END && minutes < GUERRILLA_START) {
      return {
        text: "次のゲリラ枠：" + dayLabel(now, now) + " 23:30〜（不定期）／メインは明日 21:00",
        live: false
      };
    }

    return {
      text: "次のメイン枠：" + dayLabel(now, now) + " 21:00（REALITY）",
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
