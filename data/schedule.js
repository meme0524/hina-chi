// ======================================
//  配信スケジュールを書き込む場所
//
//  REGULAR  … 毎週の定例枠（days: 0=日, 1=月, …, 6=土）
//  SPECIALS … コラボ・イベントなど、日付つきの予定
//             終わったものは自動で非表示になります
// ======================================
var SCHEDULE_REGULAR = [
  {
    label: "平日（月〜金）",
    start: "21:00",
    desc: "平日の定例枠。REALITY で配信します。",
    days: [1, 2, 3, 4, 5]
  },
  {
    label: "週末（土・日）",
    start: "21:00",
    desc: "週末の定番枠。REALITY で配信します。",
    days: [0, 6]
  }
];

var SCHEDULE_SPECIALS = [
  {
    date: "2026-08-25",
    type: "collab",
    title: "小漆間マイトさん枠「低周波ビリビリ早口言葉」",
    desc: "ビリビリしながら早口言葉！"
  },
  {
    date: "2026-08-28",
    type: "collab",
    title: "Among Us in きびきの鯖"
  },
  {
    date: "2026-08-30",
    type: "collab",
    title: "夜宵ねねさん枠 歌フェス"
  },
  {
    date: "2026-09-14",
    endDate: "2026-09-20",
    type: "event",
    title: "【達成で全員掲載】渋谷発REALITYトレイン！",
    desc: "応援よろしくお願いします！"
  }
];
