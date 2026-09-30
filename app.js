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
