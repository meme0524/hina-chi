import { PLANS_PASSWORD_SHA256 } from "../data/plans-auth.js";

const SESSION_KEY = "hina-chi-plans";

function sameHash(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderList(plans, body) {
  const list = el("ul", "plan-list");
  for (const plan of plans) {
    const link = el("a", "plan-card");
    link.href = `/plans/${plan.slug}/`;
    link.append(
      el("h2", "plan-card-title", plan.title),
      el("p", "plan-card-summary", plan.summary),
    );
    const meta = el("div", "plan-meta");
    meta.append(el("span", "", plan.duration), el("span", "", plan.players));
    link.append(meta);
    const item = el("li");
    item.append(link);
    list.append(item);
  }

  const tools = el("div", "plan-tools");
  tools.append(
    el("h2", "", "配信ツール"),
    el("p", "", "企画に関係なく使えるサイコロです。罰ゲームルーレットは、各企画のページから開きます。"),
  );
  const dice = el("a", "btn btn-outline", "サイコロ");
  dice.href = "/tools/dice/";
  tools.append(dice);
  body.replaceChildren(list, tools);
}

function renderDetail(plan, body) {
  const back = el("a", "plan-back", "← 企画一覧へ戻る");
  back.href = "/plans/";

  const meta = el("div", "plan-meta");
  meta.append(el("span", "", `所要時間 ${plan.duration}`), el("span", "", `人数 ${plan.players}`));

  const stepsSection = el("section", "plan-section");
  stepsSection.append(el("h2", "", "進め方"));
  const steps = el("ol", "plan-steps");
  for (const step of plan.steps) steps.append(el("li", "", step));
  stepsSection.append(steps);

  const coinsSection = el("section", "plan-section");
  coinsSection.append(el("h2", "", "コイン設定"));
  const coins = el("ul", "coin-list");
  for (const coin of plan.coins) {
    const effect = el("p", "coin-effect", coin.effect);
    if (coin.alt) effect.append(el("span", "coin-alt", `または ${coin.alt}`));
    const item = el("li", "coin-item");
    item.append(el("p", "coin-label", coin.label), effect);
    coins.append(item);
  }
  coinsSection.append(coins);

  const rulesSection = el("section", "plan-section");
  rulesSection.append(el("h2", "", "ルール"));
  const rules = el("ul", "plan-rules");
  for (const rule of plan.rules) rules.append(el("li", "", rule));
  rulesSection.append(rules);
  if (plan.roulette?.length) {
    const outcomes = el("ol", "roulette-outcomes");
    for (const item of plan.roulette) outcomes.append(el("li", "", item));
    rulesSection.append(outcomes);
  }

  const actions = el("div", "plan-actions");
  if (plan.roulette?.length) {
    const roulette = el("a", "btn btn-primary", "ルーレットを開く");
    roulette.href = `/tools/roulette/${plan.slug}/`;
    actions.append(roulette);
  }
  const dice = el("a", "btn btn-outline", "サイコロ");
  dice.href = "/tools/dice/";
  actions.append(dice);

  body.replaceChildren(back, meta, stepsSection, coinsSection, rulesSection, actions);
}

export function openPlans(root) {
  const gate = root.querySelector("#plans-gate");
  const input = root.querySelector("#plans-password");
  const error = root.querySelector("#plans-gate-error");
  const body = root.querySelector("#plans-body");
  const title = root.querySelector("#plans-title");
  const desc = root.querySelector("#plans-desc");
  const slug = root.dataset.planSlug || "";

  async function reveal() {
    const { PLANS, getPlan } = await import("../data/plans.js");
    gate.hidden = true;
    body.hidden = false;
    if (!slug) {
      title.textContent = "配信企画";
      desc.textContent = "進め方とコイン設定をまとめています。配信中に使うツールは各企画から開けます。";
      renderList(PLANS, body);
      return;
    }
    const plan = getPlan(slug);
    if (!plan) {
      title.textContent = "配信企画";
      desc.textContent = "この企画は見つかりませんでした。";
      body.replaceChildren();
      return;
    }
    title.textContent = plan.title;
    desc.textContent = plan.summary;
    document.title = `${plan.title} | ひなーち`;
    renderDetail(plan, body);
  }

  async function unlock(password) {
    const digest = await sha256(password);
    if (!sameHash(digest, PLANS_PASSWORD_SHA256)) {
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    error.hidden = true;
    input.removeAttribute("aria-invalid");
    await reveal();
  }

  gate.addEventListener("submit", (event) => {
    event.preventDefault();
    unlock(input.value);
  });

  if (sessionStorage.getItem(SESSION_KEY) === "1") reveal();
}
