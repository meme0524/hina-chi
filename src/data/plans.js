// 配信企画。新しいものを上に追加してください。
// roulette がある企画は、詳細ページから罰ゲームルーレットを開けます。
export const PLANS = [
  {
    slug: "biribiri",
    title: "電流ビリビリ！低周波筋トレ",
    duration: "1時間程度〜",
    players: "1人〜いくらでも",
    summary: "雑談しながらギフトを待って、投げられたコイン数に応じて筋トレや低周波を実行する企画です。",
    steps: ["説明", "雑談しながらギフトを待つ", "ギフトが投げられたら実行"],
    coins: [
      {
        label: "100コイン",
        effect: "筋トレ10回",
      },
      {
        label: "1000コイン",
        effect: "低周波1分＋筋トレ10回",
        alt: "追加罰ゲームルーレット",
      },
      {
        label: "3000コイン",
        effect: "低周波3分＋筋トレ30回",
      },
      {
        label: "タワー（10000コイン）",
        effect: "全員低周波3分＋筋トレ30回",
      },
    ],
    rules: ["ルーレットに出た目に応じて、罰ゲームを追加する。"],
    roulette: ["電流レベルUP！", "筋トレ追加！", "水分補給（苦丁茶）"],
  },
];

export function getPlan(slug) {
  return PLANS.find((plan) => plan.slug === slug);
}
