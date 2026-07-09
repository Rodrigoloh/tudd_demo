const doctors = [
  {
    id: "valeria",
    name: "Dra. Valeria Montes",
    initials: "VM",
    role: "Diagnóstico integral y prevención",
    bio: "Primera visita, limpieza, sensibilidad y planes preventivos con una explicación clara.",
    keywords: ["revision", "revisión", "limpieza", "sensibilidad", "sensible", "rutina", "chequeo", "prevencion", "prevención"]
  },
  {
    id: "ines",
    name: "Dra. Inés Aranda",
    initials: "IA",
    role: "Estética dental",
    bio: "Blanqueamiento, resinas, carillas y armonía de sonrisa con resultado natural.",
    keywords: ["blanque", "carilla", "resina", "estetica", "estética", "sonrisa", "mancha", "color", "amarillo"]
  },
  {
    id: "camila",
    name: "Dra. Camila Rohe",
    initials: "CR",
    role: "Rehabilitación y restauraciones",
    bio: "Dolor al morder, piezas fracturadas, coronas y restauraciones profundas.",
    keywords: ["dolor", "duele", "fractura", "roto", "corona", "morder", "caries", "urgencia", "conducto"]
  },
  {
    id: "sofia",
    name: "Dra. Sofía Neri",
    initials: "SN",
    role: "Odontología familiar",
    bio: "Niños, adolescentes, ansiedad dental, seguimiento familiar y consultas suaves.",
    keywords: ["hijo", "hija", "niño", "niña", "nino", "nina", "ansiedad", "miedo", "familia", "adolescente"]
  }
];

const reviews = [
  {
    name: "Mariana L.",
    meta: "Diagnóstico inicial",
    text: "Llegué sin saber con quién agendar. El asistente me llevó directo a la consulta correcta."
  },
  {
    name: "Rocío G.",
    meta: "Estética dental",
    text: "El espacio se siente privado, limpio y cero intimidante. Todo fue puntual y muy bien explicado."
  },
  {
    name: "Daniel P.",
    meta: "Rehabilitación",
    text: "Me explicaron opciones sin presión. Terminé con un plan que sí entendí y pude decidir tranquilo."
  }
];

const doctorMap = Object.fromEntries(doctors.map((doctor) => [doctor.id, doctor]));
const siteHeader = document.querySelector("#siteHeader");
const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");
const heroPhoto = document.querySelector(".hero-photo");
const heroInner = document.querySelector("#heroInner");
const thread = document.querySelector("#thread");
const chipRow = document.querySelector("#chipRow");
const assistantInput = document.querySelector("#assistantInput");
const sendBtn = document.querySelector("#sendBtn");
const doctorTrack = document.querySelector("#doctorTrack");
const reviewGrid = document.querySelector("#reviewGrid");
const modalOverlay = document.querySelector("#modalOverlay");
const modalClose = document.querySelector("#modalClose");
const modalContent = document.querySelector("#modalContent");

let bookingState = {};

function renderDoctors() {
  const cards = doctors
    .map(
      (doctor, index) => `
        <article class="doctor-card">
          <div class="doctor-art"><span>${doctor.initials}</span></div>
          <div class="doctor-body">
            <span class="doctor-index">0${index + 1}</span>
            <div class="doctor-name">${doctor.name}</div>
            <div class="doctor-role">${doctor.role}</div>
            <p class="doctor-bio">${doctor.bio}</p>
            <button class="doctor-cta" type="button" data-open-booking="${doctor.id}">agendar con ella</button>
          </div>
        </article>
      `
    )
    .join("");

  doctorTrack.innerHTML = cards + cards;
}

function renderReviews() {
  reviewGrid.innerHTML = reviews
    .map(
      (review) => `
        <article class="review-card">
          <div class="review-stars">★★★★★</div>
          <p>${review.text}</p>
          <span>${review.name} · ${review.meta}</span>
        </article>
      `
    )
    .join("");
}

function addLine(text, who) {
  const line = document.createElement("p");
  line.className = `line ${who}`;
  line.textContent = text;
  thread.appendChild(line);
  thread.scrollTop = thread.scrollHeight;
  return line;
}

function showTyping() {
  const line = document.createElement("p");
  line.className = "line bot typing";
  line.innerHTML = "<span></span><span></span><span></span>";
  thread.appendChild(line);
  thread.scrollTop = thread.scrollHeight;
  return line;
}

function addSuggestion(doctor) {
  const line = document.createElement("p");
  line.className = "line suggestion-line";
  line.innerHTML = `
    <strong>${doctor.name}</strong>
    <span>${doctor.role}</span>
    <button type="button" data-open-booking="${doctor.id}">agendar →</button>
  `;
  thread.appendChild(line);
  thread.scrollTop = thread.scrollHeight;
}

function matchDoctor(text) {
  const normalized = text.toLowerCase();
  return doctors.find((doctor) => doctor.keywords.some((keyword) => normalized.includes(keyword))) || doctors[0];
}

function handleTriage(value) {
  const text = value.trim();
  if (!text) return;

  addLine(text, "user");
  assistantInput.value = "";
  chipRow.style.display = "none";
  const typing = showTyping();

  window.setTimeout(() => {
    typing.remove();
    const doctor = matchDoctor(text);
    addLine(`Por lo que me cuentas, empezaría con ${doctor.name.replace("Dra. ", "")}: ${doctor.role.toLowerCase()}.`, "bot");
    addSuggestion(doctor);
  }, 680);
}

function nextDays(count) {
  const names = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const days = [];
  const date = new Date();

  while (days.length < count) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) {
      days.push({
        key: date.toISOString().slice(0, 10),
        label: `${names[date.getDay()]} ${date.getDate()}`
      });
    }
  }

  return days;
}

function openBooking(doctorId) {
  const doctor = doctorMap[doctorId] || doctors[0];
  const days = nextDays(5);
  const times = ["9:00", "10:30", "12:00", "15:00", "16:30"];
  bookingState = { doctor, date: "", time: "" };

  modalContent.innerHTML = `
    <div class="modal-doctor">
      <div class="modal-avatar">${doctor.initials}</div>
      <div>
        <h3 id="modalTitle">${doctor.name}</h3>
        <p>${doctor.role}</p>
      </div>
    </div>
    <span class="modal-label">elige un día</span>
    <div class="pill-row">${days.map((day) => `<button class="pill-option" type="button" data-date="${day.label}">${day.label}</button>`).join("")}</div>
    <span class="modal-label">elige un horario</span>
    <div class="pill-row">${times.map((time) => `<button class="pill-option" type="button" data-time="${time}">${time}</button>`).join("")}</div>
    <div class="form-field"><input id="bookName" type="text" placeholder="Nombre completo" /></div>
    <div class="form-field"><input id="bookEmail" type="email" placeholder="Correo electrónico" /></div>
    <div class="form-field"><input id="bookPhone" type="tel" placeholder="Teléfono o WhatsApp" /></div>
    <button class="modal-submit" id="bookSubmit" type="button">confirmar cita</button>
  `;

  modalContent.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", () => {
      modalContent.querySelectorAll("[data-date]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      bookingState.date = button.dataset.date;
    });
  });

  modalContent.querySelectorAll("[data-time]").forEach((button) => {
    button.addEventListener("click", () => {
      modalContent.querySelectorAll("[data-time]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      bookingState.time = button.dataset.time;
    });
  });

  document.querySelector("#bookSubmit").addEventListener("click", submitBooking);
  modalOverlay.classList.add("open");
  modalOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeBooking() {
  modalOverlay.classList.remove("open");
  modalOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function shake(selector) {
  modalContent.querySelectorAll(selector).forEach((element) => {
    element.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" }
      ],
      { duration: 220 }
    );
  });
}

function submitBooking() {
  const name = document.querySelector("#bookName").value.trim();
  const email = document.querySelector("#bookEmail").value.trim();

  if (!bookingState.date || !bookingState.time) {
    shake(".pill-row");
    return;
  }

  if (!name || !email) {
    shake(".form-field input");
    return;
  }

  modalContent.innerHTML = `
    <div class="confirm-state">
      <div class="confirm-icon">✓</div>
      <h3>Cita solicitada</h3>
      <p>Te enviaremos la confirmación a ${email}. La doctora recibirá tu solicitud antes de tu llegada.</p>
      <div class="confirm-detail">
        <div><span>doctora</span><strong>${bookingState.doctor.name}</strong></div>
        <div><span>día</span><strong>${bookingState.date}</strong></div>
        <div><span>hora</span><strong>${bookingState.time}</strong></div>
      </div>
      <button class="btn btn-outline" type="button" onclick="closeBooking()">listo</button>
    </div>
  `;
}

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  const factor = Math.min(y / window.innerHeight, 1);
  siteHeader.classList.toggle("scrolled", y > 30);
  heroPhoto.style.transform = `translateY(${y * 0.12}px) scale(${1 + factor * 0.03})`;
  heroInner.style.transform = `translateY(${factor * 34}px)`;
  heroInner.style.opacity = `${1 - factor * 0.72}`;
});

menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("open");
  mainNav.classList.toggle("open");
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.classList.remove("open");
    mainNav.classList.remove("open");
  });
});

sendBtn.addEventListener("click", () => handleTriage(assistantInput.value));
assistantInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleTriage(assistantInput.value);
});

chipRow.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => handleTriage(chip.dataset.msg));
});

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-open-booking]");
  if (!trigger) return;
  openBooking(trigger.dataset.openBooking);
});

modalClose.addEventListener("click", closeBooking);
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) closeBooking();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeBooking();
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in");
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

renderDoctors();
renderReviews();
