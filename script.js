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

const DIAS_SEMANA_CORTOS = ["L", "M", "M", "J", "V", "S", "D"];

// Mapa para buscar festivos por fecha "YYYY-MM-DD"
const MAPA_FESTIVOS = Object.fromEntries(FESTIVOS_2026.map((f) => [f.fecha, f]));

// Parsear fecha anclada a Colombia (UTC-5).
// Guardamos las 05:00 UTC, que equivalen a la medianoche en Bogotá.
function parseFecha(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
}

function formatearDia(fecha) {
  return DIAS_SEMANA[fecha.getUTCDay()];
}

function formatearMes(fecha, corto = false) {
  const m = fecha.getUTCMonth();
  return corto ? MESES_CORTOS[m] : MESES[m];
}

function fechaISO(fecha) {
  const y = fecha.getUTCFullYear();
  const m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const d = String(fecha.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Convierte el "ahora" del usuario a su equivalente en Bogotá
function ahoraEnBogota() {
  const ahora = new Date();
  const offsetLocalMin = ahora.getTimezoneOffset();
  const offsetBogotaMin = 300; // Bogotá es UTC-5
  return new Date(ahora.getTime() + (offsetLocalMin - offsetBogotaMin) * 60000);
}

// Estado
let filtroActivo = "todos";

// ---------- Próximo festivo y contador ----------

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

// ---------- Vista lista ----------

function renderLista() {
  const contenedor = document.getElementById("listaFestivos");
  const ahora = new Date();
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

// ---------- Vista calendario ----------

function renderCalendario() {
  const contenedor = document.getElementById("gridMeses");
  const hoyBogota = ahoraEnBogota();
  const hoyIso = `${hoyBogota.getUTCFullYear()}-${String(hoyBogota.getUTCMonth() + 1).padStart(2, "0")}-${String(hoyBogota.getUTCDate()).padStart(2, "0")}`;

  const mesesHtml = [];

  for (let mes = 0; mes < 12; mes++) {
    const festivosMes = FESTIVOS_2026.filter((f) => {
      const d = parseFecha(f.fecha);
      return d.getUTCMonth() === mes;
    });

    const primerDia = new Date(Date.UTC(2026, mes, 1, 5));
    // Día de la semana del 1 en base lunes (0=lunes, 6=domingo)
    const offsetInicio = (primerDia.getUTCDay() + 6) % 7;
    const diasEnMes = new Date(Date.UTC(2026, mes + 1, 0)).getUTCDate();

    const labelsHtml = DIAS_SEMANA_CORTOS.map(
      (d) => `<div class="dia-semana-label">${d}</div>`
    ).join("");

    const vaciasHtml = Array.from(
      { length: offsetInicio },
      () => '<div class="celda celda-vacia"></div>'
    ).join("");

    const diasHtml = Array.from({ length: diasEnMes }, (_, i) => {
      const dia = i + 1;
      const iso = `2026-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      const festivo = MAPA_FESTIVOS[iso];
      const fechaCelda = parseFecha(iso);
      const diaSemana = fechaCelda.getUTCDay();
      const esFinde = diaSemana === 0 || diaSemana === 6;
      const esHoy = iso === hoyIso;

      const clases = ["celda"];
      if (esFinde) clases.push("celda-finde");
      if (esHoy) clases.push("celda-hoy");

      if (festivo) {
        clases.push("celda-festivo");
        clases.push(`tipo-${festivo.tipo}`);
        return `<div class="${clases.join(" ")}" data-iso="${iso}" role="button" tabindex="0" aria-label="${festivo.nombre}, ${dia} de ${MESES[mes]}">${dia}</div>`;
      }

      return `<div class="${clases.join(" ")}">${dia}</div>`;
    }).join("");

    mesesHtml.push(`
      <article class="mes">
        <div class="mes-header">
          <h3 class="mes-nombre">${MESES[mes]}</h3>
          <span class="mes-cuenta">${festivosMes.length} ${festivosMes.length === 1 ? "festivo" : "festivos"}</span>
        </div>
        <div class="mes-grid">
          ${labelsHtml}
          ${vaciasHtml}
          ${diasHtml}
        </div>
      </article>
    `);
  }

  contenedor.innerHTML = mesesHtml.join("");

  // Conectar eventos
  contenedor.querySelectorAll(".celda-festivo").forEach((celda) => {
    celda.addEventListener("mouseenter", (e) => mostrarPopover(e.currentTarget, false));
    celda.addEventListener("mouseleave", () => {
      if (!popoverPersistente) ocultarPopover();
    });
    celda.addEventListener("click", (e) => {
      e.stopPropagation();
      mostrarPopover(e.currentTarget, true);
    });
    celda.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        mostrarPopover(e.currentTarget, true);
      } else if (e.key === "Escape") {
        ocultarPopover();
      }
    });
  });
}

// ---------- Popover ----------

let popoverPersistente = false;

function mostrarPopover(celda, persistente = false) {
  const popover = document.getElementById("popover");
  const iso = celda.dataset.iso;
  const festivo = MAPA_FESTIVOS[iso];
  if (!festivo) return;

  popoverPersistente = persistente;

  const fecha = parseFecha(iso);
  const dia = fecha.getUTCDate();
  const mes = MESES[fecha.getUTCMonth()];
  const diaSemana = formatearDia(fecha);

  // Contenido del popover
  const tagEl = document.getElementById("popoverTag");
  if (festivo.tipo === "emiliani") {
    tagEl.className = "tag tag-emiliani";
    tagEl.textContent = "Ley Emiliani";
  } else {
    tagEl.className = "tag tag-fija";
    tagEl.textContent = "Fecha fija";
  }

  document.getElementById("popoverNombre").textContent = festivo.nombre;
  document.getElementById("popoverFecha").textContent = `${diaSemana}, ${dia} de ${mes}`;

  // Texto extra contextual
  const extra = document.getElementById("popoverExtra");
  if (festivo.tipo === "emiliani") {
    extra.textContent = "Trasladado al lunes por la Ley 51 de 1983.";
  } else {
    extra.textContent = "Se celebra siempre en su fecha original.";
  }

  // Posicionar (solo desktop; en móvil el CSS lo fija abajo)
  const esMobile = window.matchMedia("(max-width: 640px)").matches;
  if (!esMobile) {
    const rect = celda.getBoundingClientRect();
    const popoverWidth = 260;
    const scrollY = window.scrollY;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - popoverWidth - 10));
    const top = rect.bottom + scrollY + 8;

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  popover.classList.add("visible");
  popover.setAttribute("aria-hidden", "false");
}

function ocultarPopover() {
  const popover = document.getElementById("popover");
  popover.classList.remove("visible");
  popover.setAttribute("aria-hidden", "true");
  popoverPersistente = false;
}

// ---------- Cambio de vista ----------

function inicializarToggleVista() {
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const vista = btn.dataset.view;
      document.querySelectorAll(".toggle-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      const vistaCal = document.getElementById("vistaCalendario");
      const vistaLista = document.getElementById("vistaLista");

      if (vista === "calendar") {
        vistaCal.classList.remove("hidden");
        vistaLista.classList.add("hidden");
      } else {
        vistaCal.classList.add("hidden");
        vistaLista.classList.remove("hidden");
      }
      ocultarPopover();
    });
  });
}

// ---------- Filtros lista ----------

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

// ---------- Festivos restantes ----------

function renderFestivosRestantes() {
  const ahora = new Date();
  const restantes = FESTIVOS_2026.filter((f) => parseFecha(f.fecha) >= ahora).length;
  const el = document.getElementById("festivosRestantes");
  if (restantes === 0) {
    el.textContent = "Ya no quedan festivos en 2026";
  } else {
    el.textContent = `Quedan ${restantes} festivos en el año`;
  }
}

// ---------- Descarga ICS ----------

function generarICS() {
  const stamp =
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Festivos Colombia 2026//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Festivos Colombia 2026",
    "X-WR-TIMEZONE:America/Bogota",
  ];

  FESTIVOS_2026.forEach((f) => {
    const fechaInicio = f.fecha.replace(/-/g, "");
    const fechaSig = new Date(Date.UTC(...f.fecha.split("-").map((n, i) => i === 1 ? Number(n) - 1 : Number(n))));
    fechaSig.setUTCDate(fechaSig.getUTCDate() + 1);
    const fechaFin = `${fechaSig.getUTCFullYear()}${String(fechaSig.getUTCMonth() + 1).padStart(2, "0")}${String(fechaSig.getUTCDate()).padStart(2, "0")}`;

    lineas.push("BEGIN:VEVENT");
    lineas.push(`UID:${f.fecha}@festivos-colombia-2026`);
    lineas.push(`DTSTAMP:${stamp}`);
    lineas.push(`DTSTART;VALUE=DATE:${fechaInicio}`);
    lineas.push(`DTEND;VALUE=DATE:${fechaFin}`);
    lineas.push(`SUMMARY:${f.nombre}`);
    lineas.push(
      `DESCRIPTION:Festivo oficial de Colombia. Tipo: ${f.tipo === "emiliani" ? "Ley Emiliani" : "Fecha fija"}.`
    );
    lineas.push("TRANSP:TRANSPARENT");
    lineas.push("END:VEVENT");
  });

  lineas.push("END:VCALENDAR");
  return lineas.join("\r\n");
}

function descargarICS() {
  const contenido = generarICS();
  const blob = new Blob([contenido], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "festivos-colombia-2026.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- Init ----------

function init() {
  document.getElementById("totalFestivos").textContent =
    `${FESTIVOS_2026.length} festivos`;
  document.getElementById("anioActual").textContent = new Date().getFullYear();

  renderProximoFestivo();
  renderCalendario();
  renderLista();
  renderFestivosRestantes();
  inicializarToggleVista();
  inicializarFiltros();

  // Botón descarga
  document.getElementById("btnDescargar").addEventListener("click", descargarICS);

  // Botón cerrar del popover (visible en móvil)
  document.querySelector(".popover-close").addEventListener("click", ocultarPopover);

  // Cerrar popover al hacer clic fuera
  document.addEventListener("click", (e) => {
    const popover = document.getElementById("popover");
    if (!popover.contains(e.target) && !e.target.classList.contains("celda-festivo")) {
      ocultarPopover();
    }
  });

  // Cerrar con Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") ocultarPopover();
  });

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