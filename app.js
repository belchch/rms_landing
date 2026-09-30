/* planbee landing — plan style. Reveal on scroll and the lead form; nothing else moves except the dot. */

const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && reveals.length) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: "0px 0px -10% 0px" });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

/* ---------- lead form (POST /api/lead, same contract as before) ---------- */

const leadForm = document.getElementById("lead-form");
const leadStatus = document.getElementById("lead-status");

function setLeadStatus(type, text) {
  if (!leadStatus) return;
  leadStatus.hidden = !text;
  leadStatus.textContent = text || "";
  leadStatus.className = "lead-status" + (type ? " " + type : "");
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
      setLeadStatus("err", "Укажите имя и телефон или Telegram");
      return;
    }
    submitButton.disabled = true;
    setLeadStatus("", "Отправляем заявку…");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {};
      try { data = await response.json(); } catch (_) { data = {}; }
      if (!response.ok) throw new Error(data.error || "Не удалось отправить заявку");
      leadForm.reset();
      setLeadStatus("ok", "Заявка отправлена. Мы свяжемся с вами.");
    } catch (error) {
      setLeadStatus("err", error.message || "Не удалось отправить заявку. Попробуйте ещё раз.");
    } finally {
      submitButton.disabled = false;
    }
  });
}

/* ---------- hero scene: walls draw, the dot walks, the numbers count ---------- */

const scene = document.getElementById("scene-svg");
const dimEl = document.getElementById("scene-dim");
const okEl = document.getElementById("scene-ok");
const sumEl = document.getElementById("scene-sum");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function count(el, to, ms, unit) {
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    const v = to * (1 - Math.pow(1 - k, 3));
    el.innerHTML = fmt(v) + "<small>" + unit + "</small>";
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function playScene() {
  if (!scene) return;
  scene.classList.remove("run");
  void scene.getBoundingClientRect();
  scene.classList.add("run");
  if (dimEl) { dimEl.innerHTML = "0<small>мм</small>"; okEl.innerHTML = "&nbsp;"; }
  if (sumEl) sumEl.innerHTML = "0<small>₽</small>";
  setTimeout(() => { if (dimEl) count(dimEl, 4182, 900, "мм"); }, 3600);
  setTimeout(() => { if (okEl) okEl.textContent = "размер принят ✓"; }, 4700);
  setTimeout(() => { if (sumEl) count(sumEl, 214306, 1400, "₽"); }, 5200);
}
if (scene) {
  if (reduce) {
    scene.classList.add("run");
    if (dimEl) { dimEl.innerHTML = "4 182<small>мм</small>"; okEl.textContent = "размер принят ✓"; }
    if (sumEl) sumEl.innerHTML = "214 306<small>₽</small>";
  } else {
    playScene();
    setInterval(playScene, 11000);
  }
}

/* ---------- office tabs ---------- */

for (const tab of document.querySelectorAll(".tab[data-tab]")) {
  tab.addEventListener("click", () => {
    const win = tab.closest(".win");
    for (const t of win.querySelectorAll(".tab")) t.setAttribute("aria-selected", String(t === tab));
    for (const p of win.querySelectorAll(".tabpanel")) p.hidden = p.dataset.panel !== tab.dataset.tab;
  });
}
