// ===========================================================================
// Estado global
// ===========================================================================

const STORAGE_KEYS = {
  tema: "festivos:tema",
  favoritos: "festivos:favoritos",
  pais: "festivos:pais",
  anio: "festivos:anio",
};

const estado = {
  pais: localStorage.getItem(STORAGE_KEYS.pais) || "co",
  anio: parseInt(localStorage.getItem(STORAGE_KEYS.anio), 10) || 2026,
  festivos: [],
  mapaFestivos: {},
  filtroLista: "todos",
  favoritos: new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.favoritos) || "[]")),
  tema: localStorage.getItem(STORAGE_KEYS.tema) || "oscuro",
  vistaActiva: "calendar",
  popoverPersistente: false,
  celdaActivaPopover: null,
};

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_SEMANA_CORTOS = ["L", "M", "M", "J", "V", "S", "D"];

// ===========================================================================
// Helpers de fecha
// ===========================================================================

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

function fechaISODesde(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ahoraEnBogota() {
  const ahora = new Date();
  const offsetLocalMin = ahora.getTimezoneOffset();
  const offsetBogotaMin = 300;
  return new Date(ahora.getTime() + (offsetLocalMin - offsetBogotaMin) * 60000);
}

function hoyISOBogota() {
  const h = ahoraEnBogota();
  return `${h.getUTCFullYear()}-${String(h.getUTCMonth() + 1).padStart(2, "0")}-${String(h.getUTCDate()).padStart(2, "0")}`;
}

// ===========================================================================
// Detección de puentes
// ===========================================================================

function detectarPuente(festivoIso) {
  // Un "puente" es una secuencia contigua de días no laborables alrededor del festivo
  const fecha = parseFecha(festivoIso);
  const fechas = [festivoIso];

  // Mirar hacia atrás
  let d = new Date(fecha);
  d.setUTCDate(d.getUTCDate() - 1);
  while (true) {
    const iso = fechaISODesde(d);
    const ds = d.getUTCDay();
    const esFinde = ds === 0 || ds === 6;
    const esFestivo = estado.mapaFestivos[iso];
    if (esFinde || esFestivo) {
      fechas.unshift(iso);
      d.setUTCDate(d.getUTCDate() - 1);
    } else {
      break;
    }
  }

  // Mirar hacia adelante
  d = new Date(fecha);
  d.setUTCDate(d.getUTCDate() + 1);
  while (true) {
    const iso = fechaISODesde(d);
    const ds = d.getUTCDay();
    const esFinde = ds === 0 || ds === 6;
    const esFestivo = estado.mapaFestivos[iso];
    if (esFinde || esFestivo) {
      fechas.push(iso);
      d.setUTCDate(d.getUTCDate() + 1);
    } else {
      break;
    }
  }

  return fechas.length >= 3 ? fechas : null;
}

// ===========================================================================
// Cargar festivos
// ===========================================================================

function cargarFestivos() {
  estado.festivos = obtenerFestivos(estado.pais, estado.anio);
  estado.mapaFestivos = Object.fromEntries(estado.festivos.map((f) => [f.fecha, f]));
}

// ===========================================================================
// Próximo festivo y contador
// ===========================================================================

function obtenerProximoFestivo() {
  const ahora = new Date();
  return estado.festivos.find((f) => parseFecha(f.fecha) >= ahora);
}

function renderProximoFestivo() {
  const proximo = obtenerProximoFestivo();
  const card = document.querySelector(".next-card");

  if (!proximo) {
    card.innerHTML = `
      <p style="text-align: center; padding: 2rem; color: var(--cream-soft);">
        Ya no hay más festivos en ${estado.anio}. Cambia de año arriba para ver otros.
      </p>
    `;
    return;
  }

  // Restaurar HTML original si fue reemplazado antes
  if (!document.getElementById("proximoTitulo")) {
    location.reload();
    return;
  }

  const fecha = parseFecha(proximo.fecha);
  document.getElementById("proximoTitulo").textContent = proximo.nombre;
  document.getElementById("nextWeekday").textContent = formatearDia(fecha);
  document.getElementById("nextDay").textContent = fecha.getUTCDate();
  document.getElementById("nextMonth").textContent = formatearMes(fecha);

  // Mostrar info del puente si lo hay
  const puente = detectarPuente(proximo.fecha);
  const bridgeEl = document.getElementById("nextBridge");
  if (puente && puente.length >= 3) {
    const inicio = parseFecha(puente[0]);
    const fin = parseFecha(puente[puente.length - 1]);
    bridgeEl.innerHTML = `<strong>Puente de ${puente.length} días</strong> desde el ${formatearDia(inicio)} ${inicio.getUTCDate()} hasta el ${formatearDia(fin)} ${fin.getUTCDate()} de ${formatearMes(fin)}.`;
  } else {
    bridgeEl.innerHTML = "";
  }

  actualizarContador(fecha);
}

function actualizarContador(fechaObjetivo) {
  const ahora = new Date();
  const diff = fechaObjetivo - ahora;

  if (diff <= 0) {
    dispararConfetti();
    setTimeout(renderProximoFestivo, 1500);
    return;
  }

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);
  const segundos = Math.floor((diff / 1000) % 60);

  const cdDays = document.getElementById("cdDays");
  if (cdDays) {
    cdDays.textContent = dias;
    document.getElementById("cdHours").textContent = String(horas).padStart(2, "0");
    document.getElementById("cdMinutes").textContent = String(minutos).padStart(2, "0");
    document.getElementById("cdSeconds").textContent = String(segundos).padStart(2, "0");
  }
}

// ===========================================================================
// Vista lista
// ===========================================================================

function renderLista() {
  const contenedor = document.getElementById("listaFestivos");
  const ahora = new Date();
  const proximoIso = obtenerProximoFestivo()?.fecha;

  let festivos = estado.festivos;

  if (estado.filtroLista === "emiliani") {
    festivos = festivos.filter((f) => f.tipo === "emiliani");
  } else if (estado.filtroLista === "fija") {
    festivos = festivos.filter((f) => f.tipo === "fija");
  } else if (estado.filtroLista === "proximos") {
    festivos = festivos.filter((f) => parseFecha(f.fecha) >= ahora);
  } else if (estado.filtroLista === "favoritos") {
    festivos = festivos.filter((f) => estado.favoritos.has(f.fecha));
  }

  if (festivos.length === 0) {
    contenedor.innerHTML = `
      <p style="text-align: center; padding: 2rem; color: var(--cream-soft);">
        No hay festivos que mostrar con este filtro.
      </p>
    `;
    return;
  }

  contenedor.innerHTML = festivos
    .map((f) => {
      const fecha = parseFecha(f.fecha);
      const pasado = fecha < ahora;
      const esProximo = f.fecha === proximoIso;
      const esFav = estado.favoritos.has(f.fecha);
      const claseExtra =
        (pasado ? " pasado" : "") +
        (esProximo ? " proximo" : "") +
        (esFav ? " es-favorito" : "");

      const tagHtml = f.tipo === "emiliani"
        ? '<span class="tag tag-emiliani">Trasladado</span>'
        : '<span class="tag tag-fija">Fecha fija</span>';

      return `
        <article class="festivo-item${claseExtra}" data-iso="${f.fecha}">
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

// ===========================================================================
// Vista calendario
// ===========================================================================

function renderCalendario() {
  const contenedor = document.getElementById("gridMeses");
  const hoyIso = hoyISOBogota();
  const mesesHtml = [];

  // Pre-calcular set de fechas que forman parte de puentes
  const fechasPuente = new Set();
  estado.festivos.forEach((f) => {
    const puente = detectarPuente(f.fecha);
    if (puente) puente.forEach((d) => fechasPuente.add(d));
  });

  for (let mes = 0; mes < 12; mes++) {
    const festivosMes = estado.festivos.filter((f) => {
      const d = parseFecha(f.fecha);
      return d.getUTCMonth() === mes;
    });

    const primerDia = new Date(Date.UTC(estado.anio, mes, 1, 5));
    const offsetInicio = (primerDia.getUTCDay() + 6) % 7;
    const diasEnMes = new Date(Date.UTC(estado.anio, mes + 1, 0)).getUTCDate();

    const labelsHtml = DIAS_SEMANA_CORTOS.map((d) => `<div class="dia-semana-label">${d}</div>`).join("");
    const vaciasHtml = Array.from({ length: offsetInicio }, () => '<div class="celda celda-vacia"></div>').join("");

    const diasHtml = Array.from({ length: diasEnMes }, (_, i) => {
      const dia = i + 1;
      const iso = `${estado.anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      const festivo = estado.mapaFestivos[iso];
      const fechaCelda = parseFecha(iso);
      const diaSemana = fechaCelda.getUTCDay();
      const esFinde = diaSemana === 0 || diaSemana === 6;
      const esHoy = iso === hoyIso;
      const esFav = estado.favoritos.has(iso);
      const esPuente = fechasPuente.has(iso);

      const clases = ["celda"];
      if (esFinde) clases.push("celda-finde");
      if (esHoy) clases.push("celda-hoy");
      if (esPuente && !festivo) clases.push("celda-puente");
      if (esFav) clases.push("celda-favorito");

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

  // Animación en cascada con IntersectionObserver
  const meses = contenedor.querySelectorAll(".mes");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("visible"), i * 40);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  meses.forEach((m) => observer.observe(m));

  // Eventos en celdas festivas
  contenedor.querySelectorAll(".celda-festivo").forEach((celda) => {
    celda.addEventListener("mouseenter", (e) => {
      if (!estado.popoverPersistente) mostrarPopover(e.currentTarget, false);
    });
    celda.addEventListener("mouseleave", () => {
      if (!estado.popoverPersistente) ocultarPopover();
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

// ===========================================================================
// Popover
// ===========================================================================

function mostrarPopover(celda, persistente = false) {
  const popover = document.getElementById("popover");
  const iso = celda.dataset.iso;
  const festivo = estado.mapaFestivos[iso];
  if (!festivo) return;

  estado.popoverPersistente = persistente;
  estado.celdaActivaPopover = celda;

  const fecha = parseFecha(iso);
  const dia = fecha.getUTCDate();
  const mes = MESES[fecha.getUTCMonth()];
  const diaSemana = formatearDia(fecha);

  const tagEl = document.getElementById("popoverTag");
  if (festivo.tipo === "emiliani") {
    tagEl.className = "tag tag-emiliani";
    tagEl.textContent = "Trasladado";
  } else {
    tagEl.className = "tag tag-fija";
    tagEl.textContent = "Fecha fija";
  }

  document.getElementById("popoverNombre").textContent = festivo.nombre;
  document.getElementById("popoverFecha").textContent = `${diaSemana}, ${dia} de ${mes}`;

  const extra = document.getElementById("popoverExtra");
  if (festivo.tipo === "emiliani") {
    extra.textContent = "Trasladado al lunes por traslado oficial.";
  } else {
    extra.textContent = "Se celebra siempre en su fecha original.";
  }

  // Info de puente
  const puenteEl = document.getElementById("popoverBridge");
  const puente = detectarPuente(iso);
  if (puente && puente.length >= 3) {
    const inicio = parseFecha(puente[0]);
    const fin = parseFecha(puente[puente.length - 1]);
    puenteEl.textContent = `Puente de ${puente.length} días: del ${formatearDia(inicio)} ${inicio.getUTCDate()} al ${formatearDia(fin)} ${fin.getUTCDate()} de ${formatearMes(fin)}.`;
  } else {
    puenteEl.textContent = "";
  }

  // Estado del botón favorito
  const favBtn = document.getElementById("popoverFav");
  if (estado.favoritos.has(iso)) {
    favBtn.textContent = "Quitar";
    favBtn.classList.add("active");
  } else {
    favBtn.textContent = "Guardar";
    favBtn.classList.remove("active");
  }

  // Posicionar (solo desktop)
  const esMobile = window.matchMedia("(max-width: 640px)").matches;
  if (!esMobile) {
    const rect = celda.getBoundingClientRect();
    const popoverWidth = 280;
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
  estado.popoverPersistente = false;
  estado.celdaActivaPopover = null;
}

// ===========================================================================
// Favoritos
// ===========================================================================

function toggleFavorito(iso) {
  if (estado.favoritos.has(iso)) {
    estado.favoritos.delete(iso);
    mostrarToast("Eliminado de favoritos");
  } else {
    estado.favoritos.add(iso);
    mostrarToast("Guardado en favoritos");
  }
  localStorage.setItem(STORAGE_KEYS.favoritos, JSON.stringify([...estado.favoritos]));
  renderCalendario();
  renderLista();
}

// ===========================================================================
// Toast
// ===========================================================================

let toastTimeout;
function mostrarToast(mensaje, duracion = 2500) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), duracion);
}

// ===========================================================================
// Compartir festivo individual
// ===========================================================================

async function compartirFestivo(iso) {
  const f = estado.mapaFestivos[iso];
  if (!f) return;
  const fecha = parseFecha(iso);
  const texto = `Próximo festivo en ${PAISES[estado.pais].nombre}: ${f.nombre}, ${formatearDia(fecha)} ${fecha.getUTCDate()} de ${formatearMes(fecha)} de ${estado.anio}.`;
  await intentarCompartir(texto);
}

async function compartirSitio() {
  const texto = `Calendario de festivos de ${PAISES[estado.pais].nombre} ${estado.anio}. Mira los puentes, planea vacaciones y descarga el .ics.`;
  await intentarCompartir(texto, window.location.href);
}

async function intentarCompartir(texto, url = window.location.href) {
  if (navigator.share) {
    try {
      await navigator.share({ title: "Festivos Colombia", text: texto, url });
    } catch (e) {
      // El usuario canceló, no hacer nada
    }
  } else {
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`);
      mostrarToast("Copiado al portapapeles");
    } catch (e) {
      mostrarToast("No se pudo compartir");
    }
  }
}

// ===========================================================================
// Confetti
// ===========================================================================

function dispararConfetti() {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colores = ["#E8B83B", "#E55A4E", "#EDE6D3", "#1A4A3C"];
  const piezas = [];

  for (let i = 0; i < 120; i++) {
    piezas.push({
      x: Math.random() * canvas.width,
      y: -20,
      r: 4 + Math.random() * 6,
      color: colores[Math.floor(Math.random() * colores.length)],
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 4,
      angle: Math.random() * Math.PI * 2,
      vang: -0.2 + Math.random() * 0.4,
    });
  }

  let frames = 0;
  function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    piezas.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.angle += p.vang;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
      ctx.restore();
    });
    frames++;
    if (frames < 200) {
      requestAnimationFrame(dibujar);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  dibujar();
}

// ===========================================================================
// Cambio de vista
// ===========================================================================

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
      estado.vistaActiva = vista;

      document.getElementById("vistaCalendario").classList.toggle("hidden", vista !== "calendar");
      document.getElementById("vistaLista").classList.toggle("hidden", vista !== "list");
      document.getElementById("vistaHerramientas").classList.toggle("hidden", vista !== "tools");

      ocultarPopover();
    });
  });
}

// ===========================================================================
// Filtros lista
// ===========================================================================

function inicializarFiltros() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      estado.filtroLista = btn.dataset.filter;
      renderLista();
    });
  });
}

// ===========================================================================
// Festivos restantes
// ===========================================================================

function renderFestivosRestantes() {
  const ahora = new Date();
  const restantes = estado.festivos.filter((f) => parseFecha(f.fecha) >= ahora).length;
  const el = document.getElementById("festivosRestantes");
  if (restantes === 0) {
    el.textContent = `No quedan festivos en ${estado.anio}`;
  } else {
    el.textContent = `Quedan ${restantes} festivos en el año`;
  }
}

// ===========================================================================
// Descarga ICS
// ===========================================================================

function generarICS() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Festivos ${PAISES[estado.pais].nombre} ${estado.anio}//ES`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Festivos ${PAISES[estado.pais].nombre} ${estado.anio}`,
    "X-WR-TIMEZONE:America/Bogota",
  ];

  estado.festivos.forEach((f) => {
    const [y, m, d] = f.fecha.split("-").map(Number);
    const inicio = `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`;
    const dSig = new Date(Date.UTC(y, m - 1, d));
    dSig.setUTCDate(dSig.getUTCDate() + 1);
    const fin = `${dSig.getUTCFullYear()}${String(dSig.getUTCMonth() + 1).padStart(2, "0")}${String(dSig.getUTCDate()).padStart(2, "0")}`;

    lineas.push("BEGIN:VEVENT");
    lineas.push(`UID:${f.fecha}-${estado.pais}@festivos`);
    lineas.push(`DTSTAMP:${stamp}`);
    lineas.push(`DTSTART;VALUE=DATE:${inicio}`);
    lineas.push(`DTEND;VALUE=DATE:${fin}`);
    lineas.push(`SUMMARY:${f.nombre}`);
    lineas.push(`DESCRIPTION:Festivo oficial de ${PAISES[estado.pais].nombre}. Tipo: ${f.tipo === "emiliani" ? "Trasladado" : "Fecha fija"}.`);
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
  a.download = `festivos-${estado.pais}-${estado.anio}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  mostrarToast("Descarga iniciada");
}

// ===========================================================================
// Tema
// ===========================================================================

function aplicarTema() {
  document.documentElement.setAttribute("data-theme", estado.tema);
  document.querySelector('meta[name="theme-color"]').setAttribute(
    "content",
    estado.tema === "oscuro" ? "#0E2A22" : "#F5F1E6"
  );
}

function inicializarTema() {
  aplicarTema();
  document.getElementById("btnTema").addEventListener("click", () => {
    estado.tema = estado.tema === "oscuro" ? "claro" : "oscuro";
    localStorage.setItem(STORAGE_KEYS.tema, estado.tema);
    aplicarTema();
  });
}

// ===========================================================================
// Selectores país/año
// ===========================================================================

function inicializarSelectores() {
  // Llenar años (2024 a 2030)
  const selectorAnio = document.getElementById("selectorAnio");
  for (let a = 2024; a <= 2030; a++) {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    if (a === estado.anio) opt.selected = true;
    selectorAnio.appendChild(opt);
  }

  // Seleccionar país guardado
  document.getElementById("selectorPais").value = estado.pais;

  document.getElementById("selectorPais").addEventListener("change", (e) => {
    estado.pais = e.target.value;
    localStorage.setItem(STORAGE_KEYS.pais, estado.pais);
    refrescarTodo();
  });

  document.getElementById("selectorAnio").addEventListener("change", (e) => {
    estado.anio = parseInt(e.target.value, 10);
    localStorage.setItem(STORAGE_KEYS.anio, estado.anio);
    refrescarTodo();
  });
}

function refrescarTodo() {
  cargarFestivos();
  document.getElementById("paisNombre").textContent = PAISES[estado.pais].nombre;
  document.getElementById("anioNombre").textContent = estado.anio;
  document.title = `Festivos ${PAISES[estado.pais].nombre} ${estado.anio}`;
  renderProximoFestivo();
  renderCalendario();
  renderLista();
  renderFestivosRestantes();
  renderComparador();
  actualizarApiEndpoint();
}

// ===========================================================================
// Calculadora días hábiles
// ===========================================================================

function calcularDiasHabiles() {
  const desdeInput = document.getElementById("diasHabilesDesde").value;
  const hastaInput = document.getElementById("diasHabilesHasta").value;
  const resultado = document.getElementById("resultadoHabiles");

  if (!desdeInput || !hastaInput) {
    resultado.innerHTML = `<p class="resultado-detalle" style="color: var(--coral);">Selecciona ambas fechas.</p>`;
    return;
  }

  const desde = parseFecha(desdeInput);
  const hasta = parseFecha(hastaInput);

  if (desde > hasta) {
    resultado.innerHTML = `<p class="resultado-detalle" style="color: var(--coral);">La fecha de inicio debe ser anterior a la fecha final.</p>`;
    return;
  }

  // Construir mapa de festivos para los años involucrados
  const anios = new Set();
  for (let d = new Date(desde); d <= hasta; d.setUTCDate(d.getUTCDate() + 1)) {
    anios.add(d.getUTCFullYear());
  }
  const mapaFestivosRango = {};
  anios.forEach((a) => {
    obtenerFestivos(estado.pais, a).forEach((f) => {
      mapaFestivosRango[f.fecha] = f;
    });
  });

  let habiles = 0, fines = 0, festivos = 0, total = 0;
  for (let d = new Date(desde); d <= hasta; d.setUTCDate(d.getUTCDate() + 1)) {
    total++;
    const ds = d.getUTCDay();
    const iso = fechaISODesde(d);
    if (mapaFestivosRango[iso]) {
      festivos++;
    } else if (ds === 0 || ds === 6) {
      fines++;
    } else {
      habiles++;
    }
  }

  resultado.innerHTML = `
    <div class="resultado-numero">${habiles}</div>
    <p class="resultado-detalle">
      ${habiles} días hábiles en un rango total de ${total} días.<br/>
      Excluidos: ${fines} días de fin de semana y ${festivos} festivos.
    </p>
  `;
}

// ===========================================================================
// Sugerencia de vacaciones óptimas
// ===========================================================================

function sugerirVacaciones() {
  const dias = parseInt(document.getElementById("diasDisponibles").value, 10);
  const desdeInput = document.getElementById("vacacionesDesde").value;
  const resultado = document.getElementById("resultadoVacaciones");

  if (!dias || dias < 1) {
    resultado.innerHTML = `<p class="resultado-detalle" style="color: var(--coral);">Indica al menos 1 día disponible.</p>`;
    return;
  }

  const desde = desdeInput ? parseFecha(desdeInput) : ahoraEnBogota();
  const findeAnio = new Date(Date.UTC(estado.anio, 11, 31, 5));

  if (desde > findeAnio) {
    resultado.innerHTML = `<p class="resultado-detalle" style="color: var(--coral);">La fecha está fuera del año seleccionado.</p>`;
    return;
  }

  // Algoritmo: para cada festivo futuro, mirar qué pasaría si pides
  // días alrededor de él para conectarlo con fines de semana y otros festivos
  const candidatos = [];
  const festivosFuturos = estado.festivos.filter((f) => parseFecha(f.fecha) >= desde);

  festivosFuturos.forEach((festivo) => {
    const fechaFestivo = parseFecha(festivo.fecha);

    // Probar diferentes configuraciones: tomar N días antes, después o ambos
    for (let antes = 0; antes <= Math.min(dias, 5); antes++) {
      const despues = dias - antes;
      if (despues < 0 || despues > 5) continue;

      const inicio = new Date(fechaFestivo);
      inicio.setUTCDate(inicio.getUTCDate() - antes - 5); // margen para que tome el finde anterior
      const fin = new Date(fechaFestivo);
      fin.setUTCDate(fin.getUTCDate() + despues + 5); // margen finde posterior

      // Días que el usuario realmente pide (laborales adyacentes al festivo)
      const pedidos = [];
      let d = new Date(fechaFestivo);
      d.setUTCDate(d.getUTCDate() - 1);
      let restantes = antes;
      while (restantes > 0 && d >= desde) {
        const ds = d.getUTCDay();
        const iso = fechaISODesde(d);
        if (ds !== 0 && ds !== 6 && !estado.mapaFestivos[iso]) {
          pedidos.unshift(iso);
          restantes--;
        }
        d.setUTCDate(d.getUTCDate() - 1);
      }
      d = new Date(fechaFestivo);
      d.setUTCDate(d.getUTCDate() + 1);
      restantes = despues;
      while (restantes > 0 && d <= findeAnio) {
        const ds = d.getUTCDay();
        const iso = fechaISODesde(d);
        if (ds !== 0 && ds !== 6 && !estado.mapaFestivos[iso]) {
          pedidos.push(iso);
          restantes--;
        }
        d.setUTCDate(d.getUTCDate() + 1);
      }

      if (pedidos.length !== dias) continue;

      // Calcular descanso total: festivo + pedidos + cualquier finde/festivo contiguo
      const fechas = new Set([festivo.fecha, ...pedidos]);
      // Expandir hacia atrás y adelante mientras encuentre finde o festivo
      let minDate = parseFecha([...fechas].sort()[0]);
      let maxDate = parseFecha([...fechas].sort().slice(-1)[0]);

      let cursor = new Date(minDate);
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      while (true) {
        const iso = fechaISODesde(cursor);
        const ds = cursor.getUTCDay();
        if (ds === 0 || ds === 6 || estado.mapaFestivos[iso]) {
          fechas.add(iso);
          minDate = new Date(cursor);
          cursor.setUTCDate(cursor.getUTCDate() - 1);
        } else break;
      }
      cursor = new Date(maxDate);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      while (true) {
        const iso = fechaISODesde(cursor);
        const ds = cursor.getUTCDay();
        if (ds === 0 || ds === 6 || estado.mapaFestivos[iso]) {
          fechas.add(iso);
          maxDate = new Date(cursor);
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        } else break;
      }

      // Verificar continuidad: debe ser un único bloque sin huecos
      const ordenadas = [...fechas].sort();
      let continuo = true;
      for (let i = 1; i < ordenadas.length; i++) {
        const a = parseFecha(ordenadas[i - 1]);
        const b = parseFecha(ordenadas[i]);
        if ((b - a) / (1000 * 60 * 60 * 24) !== 1) {
          continuo = false;
          break;
        }
      }
      if (!continuo) continue;

      const totalDias = ordenadas.length;
      const ratio = totalDias / dias;

      candidatos.push({
        festivo,
        pedidos,
        fechas: ordenadas,
        totalDias,
        ratio,
      });
    }
  });

  // Ordenar por mejor ratio y eliminar duplicados por bloque
  candidatos.sort((a, b) => b.ratio - a.ratio || b.totalDias - a.totalDias);
  const vistos = new Set();
  const top = [];
  for (const c of candidatos) {
    const key = c.fechas[0] + "-" + c.fechas[c.fechas.length - 1];
    if (!vistos.has(key)) {
      vistos.add(key);
      top.push(c);
      if (top.length >= 5) break;
    }
  }

  if (top.length === 0) {
    resultado.innerHTML = `<p class="resultado-detalle">No se encontraron sugerencias con esos parámetros.</p>`;
    return;
  }

  resultado.innerHTML = top
    .map((c) => {
      const inicio = parseFecha(c.fechas[0]);
      const fin = parseFecha(c.fechas[c.fechas.length - 1]);
      const chips = c.fechas
        .map((iso) => {
          const f = parseFecha(iso);
          const ds = f.getUTCDay();
          let cls = "";
          if (estado.mapaFestivos[iso]) cls = "tipo-festivo";
          else if (ds === 0 || ds === 6) cls = "tipo-finde";
          return `<span class="fecha-chip ${cls}">${f.getUTCDate()} ${formatearMes(f, true)}</span>`;
        })
        .join("");
      const pedidosTexto = c.pedidos
        .map((iso) => {
          const f = parseFecha(iso);
          return `${formatearDia(f)} ${f.getUTCDate()} de ${formatearMes(f)}`;
        })
        .join(", ");
      return `
        <article class="sugerencia">
          <div class="sugerencia-encabezado">
            <span class="sugerencia-titulo">${c.totalDias} días de descanso</span>
            <span class="sugerencia-puntaje">${dias} días pedidos · x${c.ratio.toFixed(1)}</span>
          </div>
          <p class="sugerencia-detalle">Del ${formatearDia(inicio)} ${inicio.getUTCDate()} de ${formatearMes(inicio)} al ${formatearDia(fin)} ${fin.getUTCDate()} de ${formatearMes(fin)}. Pide: ${pedidosTexto}.</p>
          <div class="sugerencia-fechas">${chips}</div>
        </article>
      `;
    })
    .join("");
}

// ===========================================================================
// Comparador países
// ===========================================================================

function renderComparador() {
  const contenedor = document.getElementById("comparadorPaises");
  if (!contenedor) return;

  const otrosPaises = Object.keys(PAISES).filter((k) => k !== estado.pais);
  const fechasActuales = new Set(estado.festivos.map((f) => f.fecha));

  contenedor.innerHTML = otrosPaises
    .map((codigo) => {
      const datosPais = PAISES[codigo];
      const festivosOtro = datosPais.generar(estado.anio);
      const coincidencias = festivosOtro.filter((f) => fechasActuales.has(f.fecha));

      const chips = coincidencias.length === 0
        ? `<span class="comparador-vacio">No comparte fechas exactas con ${PAISES[estado.pais].nombre}.</span>`
        : coincidencias
            .map((f) => {
              const fecha = parseFecha(f.fecha);
              return `<span class="fecha-chip">${fecha.getUTCDate()} ${formatearMes(fecha, true)} · ${f.nombre}</span>`;
            })
            .join("");

      return `
        <div class="comparador-pais">
          <h4>${datosPais.nombre}</h4>
          ${chips}
        </div>
      `;
    })
    .join("");
}

// ===========================================================================
// API endpoint
// ===========================================================================

function actualizarApiEndpoint() {
  const el = document.getElementById("apiEndpoint");
  if (el) {
    el.textContent = `GET ${window.location.origin}/api/festivos?pais=${estado.pais}&anio=${estado.anio}`;
  }
}

// ===========================================================================
// PWA install
// ===========================================================================

let deferredInstallPrompt = null;

function inicializarPWA() {
  // Registrar service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch((e) => {
      console.warn("SW no se pudo registrar:", e);
    });
  }

  // Capturar evento de instalación
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById("linkInstall").classList.remove("hidden");
  });

  document.getElementById("linkInstall").addEventListener("click", async (e) => {
    e.preventDefault();
    if (!deferredInstallPrompt) {
      mostrarToast("Instalación no disponible en este navegador");
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === "accepted") {
      document.getElementById("linkInstall").classList.add("hidden");
    }
    deferredInstallPrompt = null;
  });
}

// ===========================================================================
// Init
// ===========================================================================

function inicializarEventosLista() {
  document.getElementById("listaFestivos").addEventListener("click", (e) => {
    const item = e.target.closest(".festivo-item");
    if (!item) return;
    const iso = item.dataset.iso;
    // Crear una "celda virtual" para el popover
    const fakeCelda = { dataset: { iso }, getBoundingClientRect: () => item.getBoundingClientRect() };
    mostrarPopover(fakeCelda, true);
  });
}

function init() {
  cargarFestivos();
  document.getElementById("totalFestivos") && (document.getElementById("totalFestivos").textContent = "");
  document.getElementById("anioActual").textContent = new Date().getFullYear();
  document.getElementById("paisNombre").textContent = PAISES[estado.pais].nombre;
  document.getElementById("anioNombre").textContent = estado.anio;
  document.title = `Festivos ${PAISES[estado.pais].nombre} ${estado.anio}`;

  // Fecha por defecto en herramientas
  document.getElementById("diasHabilesDesde").value = hoyISOBogota();
  const enUnMes = new Date(Date.UTC(estado.anio, 11, 31));
  document.getElementById("diasHabilesHasta").value = fechaISODesde(enUnMes);
  document.getElementById("vacacionesDesde").value = hoyISOBogota();

  renderProximoFestivo();
  renderCalendario();
  renderLista();
  renderFestivosRestantes();
  renderComparador();
  actualizarApiEndpoint();

  inicializarToggleVista();
  inicializarFiltros();
  inicializarTema();
  inicializarSelectores();
  inicializarPWA();
  inicializarEventosLista();

  document.getElementById("btnDescargar").addEventListener("click", descargarICS);
  document.getElementById("btnCompartir").addEventListener("click", compartirSitio);
  document.getElementById("btnCalcularHabiles").addEventListener("click", calcularDiasHabiles);
  document.getElementById("btnSugerirVacaciones").addEventListener("click", sugerirVacaciones);
  document.getElementById("btnCopiarApi").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById("apiEndpoint").textContent);
      mostrarToast("Endpoint copiado");
    } catch {
      mostrarToast("No se pudo copiar");
    }
  });

  // Popover acciones
  document.querySelector(".popover-close").addEventListener("click", ocultarPopover);
  document.getElementById("popoverFav").addEventListener("click", () => {
    const celda = estado.celdaActivaPopover;
    if (celda) toggleFavorito(celda.dataset.iso);
    const fav = estado.favoritos.has(celda.dataset.iso);
    document.getElementById("popoverFav").textContent = fav ? "Quitar" : "Guardar";
    document.getElementById("popoverFav").classList.toggle("active", fav);
  });
  document.getElementById("popoverShare").addEventListener("click", () => {
    const celda = estado.celdaActivaPopover;
    if (celda) compartirFestivo(celda.dataset.iso);
  });

  // Cerrar popover al hacer clic fuera
  document.addEventListener("click", (e) => {
    const popover = document.getElementById("popover");
    if (!popover.contains(e.target) && !e.target.closest(".celda-festivo") && !e.target.closest(".festivo-item")) {
      ocultarPopover();
    }
  });

  // Escape cierra popover
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") ocultarPopover();
  });

  // Resize del canvas confetti
  window.addEventListener("resize", () => {
    const canvas = document.getElementById("confetti");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // Contador cada segundo
  setInterval(() => {
    const proximo = obtenerProximoFestivo();
    if (proximo) {
      actualizarContador(parseFecha(proximo.fecha));
    }
  }, 1000);

  // Si hoy es festivo, disparar confetti al cargar (una sola vez por día)
  const hoyIso = hoyISOBogota();
  if (estado.mapaFestivos[hoyIso]) {
    const ultimoConfetti = localStorage.getItem("festivos:confetti");
    if (ultimoConfetti !== hoyIso) {
      setTimeout(dispararConfetti, 600);
      localStorage.setItem("festivos:confetti", hoyIso);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}