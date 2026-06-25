// Festivos oficiales de Colombia 2026
// Fuente: Ley 51 de 1983 (Ley Emiliani) y Ley 2462 de 2025 (Virgen de Chiquinquirá)

const FESTIVOS_2026 = [
  { fecha: "2026-01-01", nombre: "Año Nuevo", tipo: "fija" },
  { fecha: "2026-01-12", nombre: "Día de los Reyes Magos", tipo: "emiliani" },
  { fecha: "2026-03-23", nombre: "Día de San José", tipo: "emiliani" },
  { fecha: "2026-04-02", nombre: "Jueves Santo", tipo: "fija" },
  { fecha: "2026-04-03", nombre: "Viernes Santo", tipo: "fija" },
  { fecha: "2026-05-01", nombre: "Día del Trabajo", tipo: "fija" },
  { fecha: "2026-05-18", nombre: "Ascensión del Señor", tipo: "emiliani" },
  { fecha: "2026-06-08", nombre: "Corpus Christi", tipo: "emiliani" },
  { fecha: "2026-06-15", nombre: "Sagrado Corazón", tipo: "emiliani" },
  { fecha: "2026-06-29", nombre: "San Pedro y San Pablo", tipo: "emiliani" },
  { fecha: "2026-07-13", nombre: "Virgen de Chiquinquirá", tipo: "emiliani" },
  { fecha: "2026-07-20", nombre: "Día de la Independencia", tipo: "fija" },
  { fecha: "2026-08-07", nombre: "Batalla de Boyacá", tipo: "fija" },
  { fecha: "2026-08-17", nombre: "Asunción de la Virgen", tipo: "emiliani" },
  { fecha: "2026-10-12", nombre: "Día de la Raza", tipo: "emiliani" },
  { fecha: "2026-11-02", nombre: "Día de Todos los Santos", tipo: "emiliani" },
  { fecha: "2026-11-16", nombre: "Independencia de Cartagena", tipo: "emiliani" },
  { fecha: "2026-12-08", nombre: "Inmaculada Concepción", tipo: "fija" },
  { fecha: "2026-12-25", nombre: "Navidad", tipo: "fija" },
];

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic"
];

const DIAS_SEMANA = [
  "domingo", "lunes", "martes", "miércoles",
  "jueves", "viernes", "sábado"
];

function parseFecha(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  // Anclar a medianoche en Colombia (UTC-5) para que el contador
  // sea consistente sin importar la zona horaria del navegador.
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
}

function formatearDia(fecha) {
  // Usar UTC porque ya guardamos la fecha como las 05:00 UTC (medianoche en Colombia)
  return DIAS_SEMANA[fecha.getUTCDay()];
}

function formatearMes(fecha, corto = false) {
  const mes = fecha.getUTCMonth();
  return corto ? MESES_CORTOS[mes] : MESES[mes];
}

// Estado
let filtroActivo = "todos";

// Próximo festivo y contador
function obtenerProximoFestivo() {
  const ahora = new Date();
  return FESTIVOS_2026.find((f) => parseFecha(f.fecha) >= ahora);
}

function renderProximoFestivo() {
  const proximo = obtenerProximoFestivo();
  const card = document.querySelector(".next-card");

  if (!proximo) {
    card.innerHTML =
      '<p style="text-align: center; padding: 2rem; color: var(--cream-soft);">' +
      "Ya no hay más festivos en 2026. Nos vemos en 2027.</p>";
    return;
  }

  const fecha = parseFecha(proximo.fecha);
  document.getElementById("proximoTitulo").textContent = proximo.nombre;
  document.getElementById("nextWeekday").textContent = formatearDia(fecha);
  document.getElementById("nextDay").textContent = fecha.getUTCDate();
  document.getElementById("nextMonth").textContent = formatearMes(fecha);

  actualizarContador(fecha);
}

function actualizarContador(fechaObjetivo) {
  const ahora = new Date();
  const diff = fechaObjetivo - ahora;

  if (diff <= 0) {
    renderProximoFestivo();
    return;
  }

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);
  const segundos = Math.floor((diff / 1000) % 60);

  document.getElementById("cdDays").textContent = dias;
  document.getElementById("cdHours").textContent = String(horas).padStart(2, "0");
  document.getElementById("cdMinutes").textContent = String(minutos).padStart(2, "0");
  document.getElementById("cdSeconds").textContent = String(segundos).padStart(2, "0");
}

// Renderizar lista
function renderLista() {
  const contenedor = document.getElementById("listaFestivos");
  const ahora = new Date();
  ahora.setHours(0, 0, 0, 0);
  const proximoIso = obtenerProximoFestivo()?.fecha;

  let festivos = FESTIVOS_2026;

  if (filtroActivo === "emiliani") {
    festivos = festivos.filter((f) => f.tipo === "emiliani");
  } else if (filtroActivo === "fija") {
    festivos = festivos.filter((f) => f.tipo === "fija");
  } else if (filtroActivo === "proximos") {
    festivos = festivos.filter((f) => parseFecha(f.fecha) >= ahora);
  }

  if (festivos.length === 0) {
    contenedor.innerHTML =
      '<p style="text-align: center; padding: 2rem; color: var(--cream-soft);">' +
      "No hay festivos que mostrar con este filtro.</p>";
    return;
  }

  contenedor.innerHTML = festivos
    .map((f) => {
      const fecha = parseFecha(f.fecha);
      const pasado = fecha < ahora;
      const esProximo = f.fecha === proximoIso;
      const claseExtra =
        (pasado ? " pasado" : "") + (esProximo ? " proximo" : "");

      const tagHtml =
        f.tipo === "emiliani"
          ? '<span class="tag tag-emiliani">Ley Emiliani</span>'
          : '<span class="tag tag-fija">Fecha fija</span>';

      return `
        <article class="festivo-item${claseExtra}">
          <div class="festivo-fecha">
            <span class="festivo-dia">${fecha.getUTCDate()}</span>
            <span class="festivo-mes">${formatearMes(fecha, true)}</span>
          </div>
          <div class="festivo-info">
            <h3>${f.nombre}</h3>
            <p>${formatearDia(fecha)}</p>
          </div>
          <div class="festivo-tag-container">${tagHtml}</div>
        </article>
      `;
    })
    .join("");
}

// Eventos
function inicializarFiltros() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filtroActivo = btn.dataset.filter;
      renderLista();
    });
  });
}

// Init
function init() {
  document.getElementById("totalFestivos").textContent =
    `${FESTIVOS_2026.length} festivos`;
  document.getElementById("anioActual").textContent = new Date().getFullYear();

  renderProximoFestivo();
  renderLista();
  inicializarFiltros();

  // Actualizar contador cada segundo
  setInterval(() => {
    const proximo = obtenerProximoFestivo();
    if (proximo) {
      actualizarContador(parseFecha(proximo.fecha));
    }
  }, 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}