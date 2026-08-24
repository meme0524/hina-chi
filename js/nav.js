(function () {
  var header = document.querySelector(".header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!header || !toggle || !nav) return;

  function isOpen() {
    return header.classList.contains("nav-open");
  }

  function setOpen(open) {
    header.classList.toggle("nav-open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニュー");
  }

  toggle.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!isOpen());
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("click", function (e) {
    if (!isOpen()) return;
    if (e.target.closest(".nav-toggle") || e.target.closest("#site-nav")) return;
    setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();
