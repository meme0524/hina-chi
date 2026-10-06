import { createRoulette } from "./roulette-wheel.js";

const MIN_COUNT = 2;
const MAX_COUNT = 30;

function clampCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return MIN_COUNT;
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(count)));
}

function loadSaved(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.tags)) return null;
    const tags = data.tags.map((tag) => String(tag ?? "").trim());
    const count = clampCount(data.count || tags.length);
    const next = tags.slice(0, count);
    while (next.length < count) next.push("");
    return next;
  } catch {
    return null;
  }
}

function save(storageKey, tags) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ count: tags.length, tags }));
  } catch {
    // 保存できなくても、いまの画面では設定を使える。
  }
}

export function mountRoulettePage({ defaults, storageKey, idleText }) {
  const rotor = document.getElementById("rotor");
  const result = document.getElementById("result");
  const spinButton = document.getElementById("spin");
  const toggle = document.getElementById("settings-toggle");
  const panel = document.getElementById("roulette-settings");
  const countInput = document.getElementById("roulette-count");
  const tagList = document.getElementById("roulette-tag-list");
  const legend = document.getElementById("legend");
  const roulette = createRoulette(rotor);
  const initial = (loadSaved(storageKey) ?? defaults.map((tag) => String(tag).trim())).slice(0, MAX_COUNT);
  let applied = initial.length >= MIN_COUNT ? initial : defaults.map((tag) => String(tag).trim());

  function readRows() {
    return [...tagList.querySelectorAll("input")].map((input) => input.value);
  }

  function renderRows(tags) {
    const count = clampCount(countInput.value);
    countInput.value = String(count);
    const current = tags ?? readRows();
    tagList.replaceChildren();
    for (let index = 0; index < count; index += 1) {
      const item = document.createElement("li");
      const label = document.createElement("label");
      const number = document.createElement("span");
      const input = document.createElement("input");
      number.textContent = String(index + 1);
      input.type = "text";
      input.maxLength = 40;
      input.placeholder = "タグ";
      input.value = current[index] ?? "";
      input.setAttribute("aria-label", `${index + 1}番のタグ`);
      label.append(number, input);
      item.append(label);
      tagList.append(item);
    }
  }

  function renderLegend() {
    const hasTag = applied.some((tag) => tag);
    legend.hidden = !hasTag;
    legend.replaceChildren();
    if (!hasTag) return;
    applied.forEach((tag, index) => {
      const item = document.createElement("li");
      const number = document.createElement("span");
      number.textContent = String(index + 1);
      item.append(number, document.createTextNode(tag || "—"));
      legend.append(item);
    });
  }

  function showIdle() {
    result.textContent = idleText;
    result.classList.remove("is-set", "is-long");
  }

  function commit(tags) {
    if (!roulette.setItems(tags.map((tag, index) => tag || String(index + 1)))) return false;
    applied = tags;
    renderLegend();
    showIdle();
    spinButton.textContent = "回す";
    save(storageKey, applied);
    return true;
  }

  function applyDraft() {
    const count = clampCount(countInput.value);
    countInput.value = String(count);
    const rows = readRows();
    while (rows.length < count) rows.push("");
    const tags = rows.slice(0, count).map((tag) => tag.trim());
    if (commit(tags)) renderRows(tags);
  }

  function setOpen(open) {
    if (open) renderRows(applied);
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "設定を閉じる" : "設定";
    if (open) countInput.focus();
  }

  async function spin() {
    if (roulette.isSpinning()) return;
    spinButton.disabled = true;
    spinButton.textContent = "回転中…";
    result.classList.remove("is-set", "is-long");
    result.textContent = "";
    const index = await roulette.spin();
    const tag = applied[index];
    const text = tag ? `${index + 1} ${tag}` : String(index + 1);
    result.textContent = text;
    result.classList.add("is-set");
    result.classList.toggle("is-long", text.length > 4);
    spinButton.disabled = false;
    spinButton.textContent = "もう一度";
  }

  countInput.value = String(applied.length);
  renderRows(applied);
  commit(applied);
  document.getElementById("count-dec").addEventListener("click", () => {
    countInput.value = String(clampCount(Number(countInput.value) - 1));
    renderRows();
  });
  document.getElementById("count-inc").addEventListener("click", () => {
    countInput.value = String(clampCount(Number(countInput.value) + 1));
    renderRows();
  });
  countInput.addEventListener("change", () => renderRows());
  document.getElementById("roulette-apply").addEventListener("click", applyDraft);
  document.getElementById("roulette-reset").addEventListener("click", () => {
    const tags = defaults.map((tag) => String(tag).trim()).slice(0, MAX_COUNT);
    countInput.value = String(tags.length);
    renderRows(tags);
    commit(tags);
  });
  toggle.addEventListener("click", () => setOpen(panel.hidden));
  spinButton.addEventListener("click", spin);
  window.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.repeat) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    if (target instanceof HTMLButtonElement && target !== spinButton) return;
    event.preventDefault();
    spin();
  });
}
