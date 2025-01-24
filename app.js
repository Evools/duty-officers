import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const db = getDatabase(app);

let dutyList = [];
let currentDutyList = [];

async function login(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, username, password);

    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "index.html";
  } catch (error) {
    alert("Ошибка авторизации: " + error.message);
  }
}
const loginForm = document.getElementById("login");
if (loginForm) {
  loginForm.addEventListener("submit", login);
}

async function saveDutyToFirebase() {
  showLoader();
  try {
    await set(ref(db, "duties/"), {
      dutyList: dutyList,
      currentDutyList: currentDutyList,
    });
    console.log("Данные успешно сохранены в Firebase.");
  } catch (error) {
    console.error("Ошибка при сохранении данных в Firebase: ", error);
  } finally {
    hideLoader();
  }
}

async function checkDutyList() {
  try {
    const snapshot = await get(ref(db, "duties"));
    if (!snapshot.exists() || snapshot.val().length === 0) {
      if (!window.location.href.includes("add-fio.html")) {
        window.location.href = "add-fio.html";
      }
    }
  } catch (error) {
    console.error("Ошибка при получении списка дежурных: ", error);
  }
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    if (!window.location.href.includes("login.html")) {
      window.location.href = "login.html";
    }
    return;
  }

  try {
    await checkDutyList();
  } catch (error) {
    console.error("Ошибка при проверке списка дежурных: ", error);
  }
});

async function loadDutyList() {
  showLoader();
  try {
    const snapshot = await get(ref(db, "duties/"));

    if (snapshot.exists()) {
      const data = snapshot.val();

      dutyList = data.dutyList || [];
      currentDutyList = data.currentDutyList || [];
      console.log("Данные успешно загружены из Firebase.");

      displayDutyList();
    } else {
      console.log("Данные в Firebase отсутствуют.");
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных из Firebase: ", error);
  } finally {
    hideLoader();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.id === "main") {
    await loadDutyList();
  }
});

function displayDutyList() {
  const dutyListDiv = document.getElementById("dutyList");
  const completedDutyListDiv = document.getElementById("completedDutyList");
  const skippedDutyListDiv = document.getElementById("skippedDutyList");
  const currentDutyListDiv = document.getElementById("currentDutyList");

  dutyListDiv.innerHTML = "";
  completedDutyListDiv.innerHTML = "";
  skippedDutyListDiv.innerHTML = "";
  currentDutyListDiv.innerHTML = "";

  dutyList.forEach((duty, index) => {
    const dutyDates =
      duty.dutyDates && duty.dutyDates.length > 0 ? duty.dutyDates.join(", ") : "нет";
    const buttonsHtml =
      duty.status === "latecomer" || duty.status === "ongoing"
        ? `
        <button class="check" onclick="markAsCompleted(${index})">
          Выполнил
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </button>
        <button class="skip" onclick="markAsSkipped(${index})">
          Сбежал
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <button class="cancel" onclick="cancelDuty(${index})">
          Сбросить
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </button>
      `
        : duty.status === "skipped"
        ? `
        <button onclick="markAsAddet(${index})">
          Добавить
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button class="cancel" onclick="cancelDuty(${index})">
          Сбросить
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </button>
        `
        : duty.status === "completed"
        ? `
          <button onclick="markAsAddet(${index})">
            Добавить
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        `
        : `
        <button onclick="markAsAddet(${index})">
          Добавить
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button class="latecomer" onclick="markAsAddet(${index}, ${true})">
          Опоздал
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </button>
      `;

    const dutyHtml = `
      <div class="duty ${duty.status}">
        <span>${duty.name} - Дежурств: ${duty.count}</span>
        <div class="late">Опозданий: <span>${duty.dutyLate ? duty.dutyLate : 0}</span></div>
        <div class="dates">Даты дежурств: ${dutyDates}</div>
        <div class="buttons">
          ${buttonsHtml}
        </div>
      </div>
    `;

    if (duty.status === "completed") {
      completedDutyListDiv.innerHTML += dutyHtml;
    } else if (duty.status === "skipped") {
      skippedDutyListDiv.innerHTML += dutyHtml;
    } else if (duty.status === "latecomer" || duty.status === "ongoing") {
      currentDutyListDiv.innerHTML += dutyHtml;
    } else {
      dutyListDiv.innerHTML += dutyHtml;
    }
  });

  updateStatistics();
}

function updateStatistics() {
  const ongoingCount = dutyList.filter((d) => d.status === "ongoing").length;
  const completedCount = dutyList.filter((d) => d.status === "completed").length;
  const skippedCount = dutyList.filter((d) => d.status === "skipped").length;

  document.getElementById("totalDutyCount").innerText = `Всего дежурных: ${
    dutyList.length - ongoingCount - completedCount - skippedCount
  }`;
  document.getElementById("ongoingDutyCount").innerText = `Текущие дежурства: ${ongoingCount}`;
  document.getElementById(
    "completedDutyCount"
  ).innerText = `Завершенные дежурства: ${completedCount}`;
  document.getElementById("skippedDutyCount").innerText = `Сбежавшие дежурства: ${skippedCount}`;
  document.getElementById(
    "lastResetDate"
  ).innerText = `Последнее обновление статистики: ${new Date().toLocaleDateString()}`;
}

async function markAsAddet(index, isLatecomer) {
  showLoader();

  try {
    const duty = dutyList[index];

    if (currentDutyList.some((d) => d.name === duty.name)) {
      alert("Этот дежурный уже в текущем дежурстве.");
      return;
    }

    if (duty.status !== "skipped" && !isLatecomer) {
      duty.count++;
    }

    if (isLatecomer) {
      duty.status = "latecomer";
      duty.dutyDates = duty.dutyDates ? [...duty.dutyDates] : [];
      duty.dutyLate = duty.dutyLate || duty.dutyLate === 0 ? duty.dutyLate + 1 : 0;
    } else {
      duty.status = "ongoing";
      if (duty.dutyDates) {
        duty.dutyDates.push(new Date().toLocaleDateString());
      } else {
        duty.dutyDates = [new Date().toLocaleDateString()];
      }
    }

    currentDutyList.push({
      name: duty.name,
      count: duty.count,
      dutyDates: [...duty.dutyDates],
    });

    await saveDutyToFirebase();
    displayDutyList();
  } catch (error) {
    console.error("Ошибка при добавлении дежурного: ", error);
  } finally {
    hideLoader();
  }
}
window.markAsAddet = markAsAddet;

async function markAsCompleted(index) {
  showLoader();

  try {
    const duty = dutyList[index];

    if (duty.status !== "latecomer" && duty.status !== "ongoing") {
      alert("Этот дежурный не может быть завершен.");
      return;
    }

    if (duty.status === "latecomer") {
      duty.status = "";
    } else {
      duty.status = "completed";
    }

    currentDutyList = currentDutyList.filter((d) => d.name !== duty.name);

    const completedCount = dutyList.filter((d) => d.status === "completed").length;
    if (completedCount === dutyList.length) {
      dutyList = dutyList.map((item) => ({ ...item, status: "" }));
    }

    await saveDutyToFirebase();
    displayDutyList();
  } catch (error) {
    console.error("Ошибка при обновлении дежурного: ", error);
  } finally {
    hideLoader();
  }
}
window.markAsCompleted = markAsCompleted;

async function markAsSkipped(index) {
  showLoader();

  try {
    const duty = dutyList[index];
    if (duty.status !== "latecomer" && duty.status !== "ongoing") {
      alert("Этот дежурный не может быть отмечен как сбежавший.");
      return;
    }

    duty.status = "skipped";
    currentDutyList = currentDutyList.filter((d) => d.name !== duty.name);
    await saveDutyToFirebase();
    displayDutyList();
  } catch (error) {
    console.error("Ошибка при сбросе дежурного: ", error);
  } finally {
    hideLoader();
  }
}
window.markAsSkipped = markAsSkipped;

async function cancelDuty(index) {
  showLoader();

  try {
    const duty = dutyList[index];
    if (duty.status === "latecomer" || duty.status === "ongoing") {
      currentDutyList = currentDutyList.filter((d) => d.name !== duty.name);
    }

    if (duty.status === "ongoing") {
      duty.count--;
      duty.dutyDates.pop();
    }

    duty.status = "";

    await saveDutyToFirebase();
    displayDutyList();
  } catch (error) {
    console.error("Ошибка при отмене дежурного: ", error);
  } finally {
    hideLoader();
  }
}
window.cancelDuty = cancelDuty;

function selectDuties() {
  const eligibleDuties = dutyList.filter((duty) => duty.status === "");
  if (eligibleDuties.length < 3) {
    alert("Недостаточно дежурных для выбора.");
    return;
  }

  const selectedDuties = [];
  while (selectedDuties.length < 3) {
    const randomIndex = Math.floor(Math.random() * eligibleDuties.length);
    const selectedDuty = eligibleDuties[randomIndex];
    if (!selectedDuties.includes(selectedDuty)) {
      selectedDuties.push(selectedDuty);
    }
  }

  selectedDuties.forEach((duty) => markAsAddet(dutyList.indexOf(duty)));
}

function logout() {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Ошибка выхода: ", error);
    });
}

const addFio = async (event) => {
  event.preventDefault();
  const fioList = document
    .getElementById("fioList")
    .value.split("\n")
    .map((fio) => fio.trim())
    .filter((fio) => fio.length > 0);

  if (fioList.length === 0) {
    alert("Список не может быть пустым");
    return;
  }

  try {
    await set(ref(db, "duties/"), {
      dutyList: fioList.map((fio) => ({
        name: fio,
        count: 0,
        status: "",
        dutyDates: [],
        dutyLate: 0,
      })),
      currentDutyList: [],
    });
    alert("Список ФИО успешно сохранен!");
    window.location.href = "index.html"; // Редирект на главную страницу
  } catch (error) {
    console.error("Ошибка при сохранении данных: ", error);
    alert("Не удалось сохранить данные. Попробуйте снова.");
  }
};
const fioForm = document.getElementById("fioForm");
if (fioForm) {
  fioForm.addEventListener("submit", addFio);
}

const logoutButton = document.getElementById("logout");
if (logoutButton) {
  logoutButton.addEventListener("click", logout);
}
const selectDutiesButton = document.getElementById("selectDuties");

if (selectDutiesButton) {
  selectDutiesButton.addEventListener("click", selectDuties);
}

function showLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.remove("hidden");
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("hidden");
}
