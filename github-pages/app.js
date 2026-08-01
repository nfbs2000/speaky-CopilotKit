const tabs = document.querySelectorAll("[data-topology]");
const panels = document.querySelectorAll("[data-panel]");

function selectTopology(name) {
  tabs.forEach((tab) => {
    const selected = tab.dataset.topology === name;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== name;
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectTopology(tab.dataset.topology));
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const current = Array.from(tabs).indexOf(tab);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(current + direction + tabs.length) % tabs.length];
    next.focus();
    selectTopology(next.dataset.topology);
  });
});

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".side-nav a");

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navLinks.forEach((link) => {
      link.toggleAttribute("aria-current", link.hash === `#${visible.target.id}`);
    });
  },
  { rootMargin: "-18% 0px -64% 0px", threshold: [0.15, 0.35, 0.65] },
);

sections.forEach((section) => observer.observe(section));

