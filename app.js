const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- reveal on scroll (with fallback) ---------- */

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reducedMotion) {
  document.documentElement.classList.add("reveal-ready");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -32px" }
  );

  revealElements.forEach((element) => revealObserver.observe(element));

  // Fallback: if the observer never fires (throttled tab, anchor jump,
  // odd embedder), nothing must stay invisible.
  window.setTimeout(() => {
    revealElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        element.classList.add("visible");
      }
    });
  }, 900);
  window.setTimeout(() => {
    revealElements.forEach((element) => element.classList.add("visible"));
  }, 4000);
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

/* ---------- sticky header state ---------- */

const header = document.querySelector(".site-header");

function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

/* ---------- hero scene loop ---------- */

const scene = document.getElementById("hero-scene");
const dimValue = document.getElementById("hero-dim");
const sumValue = document.getElementById("hero-sum");

function formatNumber(value) {
  return value.toLocaleString("ru-RU").replace(/ /g, " ");
}

let sceneTimers = [];

function later(fn, delay) {
  sceneTimers.push(window.setTimeout(fn, delay));
}

function countUp(element, target, duration, suffix, delay) {
  element.textContent = "0" + suffix;
  later(() => {
    const start = performance.now();
    (function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatNumber(Math.round(target * eased)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    })(performance.now());
  }, delay);
}

const routeMask = scene ? scene.querySelector(".route-mask-stroke") : null;
const compactScene = window.matchMedia("(max-width: 680px)");
let sceneOnScreen = true;

if (scene && "IntersectionObserver" in window) {
  new IntersectionObserver((entries) => {
    sceneOnScreen = entries[0].isIntersecting;
  }).observe(scene);
}

// The route is drawn from JS (inline styles force the SVG mask to repaint —
// WebKit does not reliably repaint CSS-animated mask contents).
function drawRoute() {
  if (!routeMask) return;
  routeMask.style.animation = "none";
  routeMask.style.strokeDasharray = "520";
  routeMask.style.strokeDashoffset = "520";
  later(() => {
    const start = performance.now();
    (function tick(now) {
      const progress = Math.min(1, (now - start) / 1200);
      routeMask.style.strokeDashoffset = String(520 * (1 - progress));
      if (progress < 1) requestAnimationFrame(tick);
    })(performance.now());
  }, 250);
}

function restartScene() {
  if (!sceneOnScreen || document.hidden) {
    later(restartScene, 1500);
    return;
  }
  scene.classList.add("fading");
  later(() => {
    scene.classList.remove("play");
    void scene.offsetWidth; // reflow resets the CSS timeline
    scene.classList.remove("fading");
    scene.classList.add("play");
    playScene();
  }, 500);
}

function playScene() {
  sceneTimers.forEach(window.clearTimeout);
  sceneTimers = [];

  drawRoute();
  countUp(dimValue, 4182, 900, " мм", 5000);
  countUp(sumValue, 214306, 1100, " ₽", compactScene.matches ? 2400 : 7400);

  later(restartScene, 14000);
}

if (scene && dimValue && sumValue) {
  if (reducedMotion) {
    dimValue.textContent = "4 182 мм";
    sumValue.textContent = "214 306 ₽";
  } else {
    playScene();
  }
}

/* ---------- live rangefinder value in the field mock ---------- */

const measurementValues = ["4 182 мм", "3 640 мм", "2 715 мм", "6 090 мм"];
const measurementElements = document.querySelectorAll(".live-measure");
let measurementIndex = 0;

if (measurementElements.length && !reducedMotion) {
  window.setInterval(() => {
    measurementIndex = (measurementIndex + 1) % measurementValues.length;
    measurementElements.forEach((element) => {
      element.textContent = measurementValues[measurementIndex];
    });
  }, 2400);
}

/* ---------- workspace tabs ---------- */

const estimateTabs = Array.from(document.querySelectorAll("[data-estimate-tab]"));
const estimatePanels = Array.from(document.querySelectorAll("[data-estimate-panel]"));

function activateEstimateTab(tab) {
  const target = tab.dataset.estimateTab;

  estimateTabs.forEach((item) => {
    const isActive = item === tab;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
    item.tabIndex = isActive ? 0 : -1;
  });

  estimatePanels.forEach((panel) => {
    panel.hidden = panel.dataset.estimatePanel !== target;
  });
}

estimateTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateEstimateTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % estimateTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + estimateTabs.length) % estimateTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = estimateTabs.length - 1;

    if (nextIndex !== index) {
      event.preventDefault();
      activateEstimateTab(estimateTabs[nextIndex]);
      estimateTabs[nextIndex].focus();
    }
  });
});

/* ---------- lead form ---------- */

const leadForm = document.getElementById("lead-form");
const leadStatus = document.getElementById("lead-status");

function setLeadStatus(type, text) {
  if (!leadStatus) return;

  leadStatus.hidden = !text;
  leadStatus.textContent = text || "";
  leadStatus.className = "lead-status" + (type ? " is-" + type : "");
}

if (leadForm) {
  leadForm.setAttribute("novalidate", "");
  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = leadForm.querySelector('button[type="submit"]');
    const formData = new FormData(leadForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      comment: String(formData.get("comment") || "").trim(),
      company: String(formData.get("company") || "").trim(),
    };

    if (!payload.name || !payload.contact) {
      setLeadStatus("error", "Укажите имя и телефон или Telegram");
      return;
    }

    submitButton.disabled = true;
    setLeadStatus("pending", "Отправляем заявку…");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.error || "Не удалось отправить заявку");
      }

      leadForm.reset();
      setLeadStatus("ok", "Заявка отправлена. Мы свяжемся с вами.");
    } catch (error) {
      setLeadStatus(
        "error",
        error.message || "Не удалось отправить заявку. Попробуйте ещё раз."
      );
    } finally {
      submitButton.disabled = false;
    }
  });
}
