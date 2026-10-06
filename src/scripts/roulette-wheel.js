const SVG_NS = "http://www.w3.org/2000/svg";

function svg(name, attrs) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function polar(cx, cy, radius, angle) {
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function segmentFill(index, count) {
  if (count % 2 === 1 && index === count - 1) return "#7c2d12";
  return index % 2 === 0 ? "#ea580c" : "#2a211c";
}

function drawWheel(rotor, items) {
  const count = items.length;
  const size = 200;
  const center = size / 2;
  const radius = 94;
  const slice = (Math.PI * 2) / count;
  const root = svg("svg", { viewBox: `0 0 ${size} ${size}`, role: "img", "aria-hidden": "true" });

  for (let index = 0; index < count; index += 1) {
    const mid = -Math.PI / 2 + index * slice;
    const start = mid - slice / 2;
    const end = mid + slice / 2;
    const [x1, y1] = polar(center, center, radius, start);
    const [x2, y2] = polar(center, center, radius, end);
    const large = end - start > Math.PI ? 1 : 0;
    root.append(
      svg("path", {
        d: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`,
        fill: segmentFill(index, count),
        stroke: "#14110e",
        "stroke-width": "1.5",
      }),
    );

    const numberSize = count <= 4 ? 26 : count <= 8 ? 18 : 14;
    root.append(wheelText(String(index + 1), mid, radius * 0.52, numberSize, "700"));
  }

  root.append(svg("circle", { cx: center, cy: center, r: 16, fill: "#14110e", stroke: "#ffedd5", "stroke-width": "3" }));
  root.append(svg("circle", { cx: center, cy: center, r: radius, fill: "none", stroke: "#ffedd5", "stroke-width": "4" }));
  rotor.replaceChildren(root);
}

function wheelText(value, angle, textRadius, fontSize, weight) {
  const [x, y] = polar(100, 100, textRadius, angle);
  const degrees = (angle * 180) / Math.PI + 90;
  const text = svg("text", {
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    fill: "#fff7ed",
    "font-size": fontSize,
    "font-weight": weight,
    "font-family": "Noto Sans JP, sans-serif",
    transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${degrees.toFixed(2)})`,
  });
  text.textContent = value;
  return text;
}

export function createRoulette(rotor) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let items = [];
  let rotation = 0;
  let spinning = false;

  function render(nextItems) {
    items = nextItems;
    drawWheel(rotor, items);
  }

  function spin() {
    if (spinning || items.length === 0) return Promise.resolve(null);
    spinning = true;
    const index = Math.floor(Math.random() * items.length);
    const slice = 360 / items.length;
    const jitter = (Math.random() - 0.5) * slice * 0.7;
    const target = ((-(index * slice + jitter) % 360) + 360) % 360;
    const current = ((rotation % 360) + 360) % 360;
    let delta = target - current;
    if (delta < 8) delta += 360;
    delta += 360 * (4 + Math.floor(Math.random() * 2));
    rotation += delta;

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        spinning = false;
        resolve(index);
      };

      if (reducedMotion) {
        rotor.style.transition = "none";
        rotor.style.transform = `rotate(${rotation}deg)`;
        finish();
        return;
      }

      rotor.style.transition = "transform 4.6s cubic-bezier(0.12, 0.72, 0.06, 1)";
      rotor.getBoundingClientRect();
      rotor.style.transform = `rotate(${rotation}deg)`;
      const timer = window.setTimeout(finish, 5000);
      rotor.addEventListener(
        "transitionend",
        (event) => {
          if (event.propertyName !== "transform") return;
          window.clearTimeout(timer);
          finish();
        },
        { once: true },
      );
    });
  }

  function setItems(nextItems) {
    if (spinning) return false;
    rotation = 0;
    rotor.style.transition = "none";
    rotor.style.transform = "rotate(0deg)";
    render(nextItems);
    return true;
  }

  return {
    spin,
    setItems,
    isSpinning: () => spinning,
  };
}
