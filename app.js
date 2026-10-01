const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- hero: six scroll steps on a sticky two-panel stage ---------- */

const hero = document.querySelector(".hero");
const nav = document.querySelector(".nav");
const nextButton = hero ? hero.querySelector(".next") : null;
const LAST_STEP = 5;

let step = 0;
let ticking = false;

function heroStepAt(scrollOffset, viewport) {
  // A step takes one screen of scroll; it switches a third of a screen early
  // so the next picture is already there when the user stops scrolling.
  return Math.max(0, Math.min(LAST_STEP, Math.floor((scrollOffset + viewport * 0.35) / viewport)));
}

function syncHero() {
  ticking = false;
  if (!hero || !nav) return;

  const viewport = window.innerHeight || 800;
  const rect = hero.getBoundingClientRect();
  const nextStep = heroStepAt(-rect.top, viewport);

  if (nextStep !== step) {
    step = nextStep;
    hero.dataset.step = String(step);
  }

  // Past the hero the logo sits on its own ink plate over any section.
  const past = rect.bottom <= nav.offsetHeight;
  nav.classList.toggle("is-solid", past);
  nav.classList.toggle("on-honey", !past && step >= 4);
  // Over the honey panel (step 0, and the full honey lockup of step 5)
  // the mark turns ink; everywhere else it is honey + white.
  nav.dataset.tone = !past && (step === 0 || step === LAST_STEP) ? "ink" : "light";
}

function requestSync() {
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(syncHero);
  }
}

if (hero && nav) {
  syncHero();
  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", requestSync);
}

if (nextButton) {
  nextButton.addEventListener("click", (event) => {
    event.preventDefault();
    const viewport = window.innerHeight || 800;
    const target = Math.min(LAST_STEP, step + 1);
    // land in the middle of the next step's range, not on its edge
    const top = hero.offsetTop + target * viewport + viewport * 0.15;
    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  });
}

/* ---------- estimate tabs ---------- */

const tabs = Array.from(document.querySelectorAll('.sheet-tabs [role="tab"]'));
const panels = Array.from(document.querySelectorAll(".sheet-panel"));

function activateTab(tab) {
  tabs.forEach((item) => {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tab.dataset.tab;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex !== index) {
      event.preventDefault();
      activateTab(tabs[nextIndex]);
      tabs[nextIndex].focus();
    }
  });
});

/* ---------- footer mark: letters light up under the pointer ---------- */

const footLock = document.querySelector(".foot-lock");
const footWord = footLock ? footLock.querySelector(".foot-word") : null;
const footLetters = footWord ? Array.from(footWord.querySelectorAll(".fl")) : [];

if (footWord && footLetters.length && window.matchMedia("(hover: hover)").matches) {
  let hot = -1;

  const light = (index) => {
    if (index === hot) return;
    hot = index;
    footLetters.forEach((letter, i) => {
      const distance = index < 0 ? 99 : Math.abs(i - index);
      letter.classList.toggle("is-hot", distance === 0);
      letter.classList.toggle("is-near", distance === 1);
    });
  };

  footLock.addEventListener("pointermove", (event) => {
    const x = event.clientX;
    let index = -1;
    footLetters.forEach((letter, i) => {
      const box = letter.getBoundingClientRect();
      if (x >= box.left - 6 && x <= box.right + 6) index = i;
    });
    light(index);
  });
  footLock.addEventListener("pointerleave", () => light(-1));
}

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

  leadForm.addEventListener("input", (event) => {
    if (event.target.getAttribute("aria-invalid") === "true" && event.target.value.trim()) {
      event.target.removeAttribute("aria-invalid");
    }
  });

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

    const missing = [];
    if (!payload.name) missing.push(leadForm.elements.name);
    if (!payload.contact) missing.push(leadForm.elements.contact);
    if (missing.length) {
      missing.forEach((input) => input.setAttribute("aria-invalid", "true"));
      missing[0].focus();
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
        throw new Error(data.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
      }

      leadForm.reset();
      setLeadStatus("ok", "Заявка отправлена. Свяжемся с вами в течение рабочего дня.");
    } catch (error) {
      const offline = error instanceof TypeError;
      setLeadStatus(
        "error",
        offline ? "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз." : error.message
      );
    } finally {
      submitButton.disabled = false;
    }
  });
}
