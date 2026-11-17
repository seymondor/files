const navigationLinks = document.querySelectorAll(".site-nav a");

function updateNavigation() {
  const currentHash = window.location.hash || "#home";
  navigationLinks.forEach((link) => {
    if (link.hash === currentHash) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

window.addEventListener("hashchange", updateNavigation);
updateNavigation();

const shareUrl = new URL(window.location.href);
shareUrl.hash = "";
shareUrl.search = "";
if (shareUrl.protocol === "http:" || shareUrl.protocol === "https:") {
  const url = encodeURIComponent(shareUrl.href);
  document.querySelector('[data-share="telegram"]').href = "https://t.me/share/url?url=" + url;
  document.querySelector('[data-share="vk"]').href = "https://vk.com/share.php?url=" + url;
}

const feedback = document.querySelector("#feedback");
const status = document.querySelector("#form-status");
const draftActions = document.querySelector("#draft-actions");
const draftLink = document.querySelector("#open-draft");
const recipientLink = document.querySelector("#contact-email");
const fields = [
  { input: feedback.elements.name, error: document.querySelector("#error-name"), empty: "Введите имя." },
  { input: feedback.elements.email, error: document.querySelector("#error-email"), empty: "Введите email." },
  { input: feedback.elements.message, error: document.querySelector("#error-message"), empty: "Введите сообщение." }
];

function showError(field, message) {
  field.error.textContent = message;
  field.error.hidden = !message;
  if (message) {
    field.input.setAttribute("aria-invalid", "true");
  } else {
    field.input.removeAttribute("aria-invalid");
  }
}

feedback.noValidate = true;
feedback.addEventListener("submit", (event) => {
  event.preventDefault();
  const [name, email, message] = fields.map((field) => field.input.value.trim());
  const errors = fields.map((field) => field.input.value.trim() ? "" : field.empty);
  if (email && (!email.includes("@") || feedback.elements.email.validity.typeMismatch)) {
    errors[1] = "Введите корректный email с символом @.";
  }
  fields.forEach((field, index) => showError(field, errors[index]));

  const firstError = errors.findIndex(Boolean);
  if (firstError !== -1) {
    draftActions.hidden = true;
    status.textContent = "";
    fields[firstError].input.focus();
    return;
  }

  const subject = encodeURIComponent("Сообщение с сайта-портфолио");
  const body = encodeURIComponent("Имя: " + name + "\r\nEmail: " + email + "\r\n\r\n" + message);
  draftLink.href = recipientLink.getAttribute("href") + "?subject=" + subject + "&body=" + body;
  status.textContent = "Черновик готов. Его можно открыть в почтовом приложении.";
  draftActions.hidden = false;
});
feedback.addEventListener("input", (event) => {
  const field = fields.find((item) => item.input === event.target);
  if (field && field.input.hasAttribute("aria-invalid")) showError(field, "");
  draftActions.hidden = true;
  status.textContent = "";
});

const dialog = document.querySelector("#project-dialog");
const demoContainer = document.querySelector("#dialog-demo");
const projects = {
  focus: {
    title: "Фокус",
    summary: "Запустите сессию на 25 минут. Во время отсчёта таймер можно приостановить или сбросить.",
    setup: setUpTimer
  },
  rhythm: {
    title: "Ритм",
    summary: "Отметьте выполненные действия и посмотрите, как меняется счётчик.",
    setup: setUpHabits
  },
  route: {
    title: "По пути",
    summary: "Выберите длительность, чтобы отфильтровать список прогулок.",
    setup: setUpRoutes
  }
};

function setUpTimer() {
  const duration = 25 * 60 * 1000;
  let remaining = duration;
  let deadline = 0;
  let interval = null;
  const display = demoContainer.querySelector(".timer-time");
  const toggle = demoContainer.querySelector('[data-timer="toggle"]');
  const reset = demoContainer.querySelector('[data-timer="reset"]');
  const timerStatus = demoContainer.querySelector(".demo-status");

  function render() {
    const seconds = Math.ceil(remaining / 1000);
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    display.textContent = minutes + ":" + String(seconds % 60).padStart(2, "0");
  }

  function stop() {
    clearInterval(interval);
    interval = null;
  }

  function tick() {
    remaining = Math.max(0, deadline - Date.now());
    render();
    if (remaining === 0) {
      stop();
      timerStatus.textContent = "Сессия завершена";
      toggle.textContent = "Старт";
    }
  }

  toggle.addEventListener("click", () => {
    if (interval !== null) {
      tick();
      if (remaining === 0) return;
      stop();
      timerStatus.textContent = "Пауза";
      toggle.textContent = "Продолжить";
      return;
    }
    if (remaining === 0) remaining = duration;
    deadline = Date.now() + remaining;
    interval = setInterval(tick, 150);
    render();
    timerStatus.textContent = "Сессия идёт";
    toggle.textContent = "Пауза";
  });

  reset.addEventListener("click", () => {
    stop();
    remaining = duration;
    render();
    timerStatus.textContent = "Готов к началу";
    toggle.textContent = "Старт";
  });

  dialog.addEventListener("close", stop, { once: true });
}

function setUpHabits() {
  const panel = demoContainer.querySelector(".demo-rhythm");
  const checkboxes = Array.from(panel.querySelectorAll("input"));
  const count = panel.querySelector(".habit-count");
  panel.addEventListener("change", () => {
    const done = checkboxes.filter((checkbox) => checkbox.checked).length;
    count.textContent = "Выполнено " + done + " из " + checkboxes.length;
  });
}

function setUpRoutes() {
  const select = demoContainer.querySelector("select");
  const routes = Array.from(demoContainer.querySelectorAll("[data-minutes]"));
  const count = demoContainer.querySelector(".route-count");
  select.addEventListener("change", () => {
    routes.forEach((route) => {
      route.hidden = select.value !== "all" && Number(route.dataset.minutes) > Number(select.value);
    });
    count.textContent = "Доступно маршрутов: " + routes.filter((route) => !route.hidden).length;
  });
}

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.open;
    const project = projects[id];
    document.querySelector("#dialog-title").textContent = project.title;
    document.querySelector("#dialog-summary").textContent = project.summary;
    demoContainer.replaceChildren(document.querySelector("#" + id + "-template").content.cloneNode(true));
    project.setup();
    dialog.showModal();
  });
});
