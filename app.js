const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px" }
  );

  document.documentElement.classList.add("reveal-ready");
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

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
    const isActive = panel.dataset.estimatePanel === target;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
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

const leadForm = document.getElementById("lead-form");
const leadStatus = document.getElementById("lead-status");

function setLeadStatus(type, text) {
  if (!leadStatus) return;

  leadStatus.hidden = !text;
  leadStatus.textContent = text || "";
  leadStatus.className = "lead-status" + (type ? " is-" + type : "");
}

if (leadForm) {
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
