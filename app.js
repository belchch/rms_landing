const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const laserValues = ["4 182 мм", "3 640 мм", "2 715 мм", "6 090 мм", "4 182 мм"];
let laserIndex = 0;

setInterval(() => {
  laserIndex = (laserIndex + 1) % laserValues.length;
  document.querySelectorAll(".laser-value").forEach((el) => {
    el.textContent = laserValues[laserIndex];
  });
}, 2200);
