// 配信企画ページのパスワード照合用。パスワードそのものは書かない。
// 変えるとき:
//   node -e "console.log(require('crypto').createHash('sha256').update('新しいパスワード').digest('hex'))"
// 出た値を下の文字列と差し替える。
export const PLANS_PASSWORD_SHA256 = "18971507fbfdcf6bee82d3dd744f093b41d914fe879c2d324239da828a91790e";
