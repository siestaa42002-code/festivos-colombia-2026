/*
  Festivos - Calendario de días festivos
  Autor: siestaa42002-code
  https://github.com/siestaa42002-code/festivos-colombia-2026
*/

// ===========================================================================
// Estado
// ===========================================================================

const STORAGE = {
  tema: "festivos:tema",
  anio: "festivos:anio",
};

const HOY = hoyEnBogota();

const estado = {
  tema: localStorage.getItem(STORAGE.tema) || "claro",
  anio: parseInt(localStorage.getItem(STORAGE.anio), 10) || HOY.getUTCFullYear(),
  vistaActiva: "calendario",
  filtroLista: "todos",
  festivos: [],
};

window.estado = estado;

// ===========================================================================
// Helpers de UI
// ===========================================================================

function mostrarToast(mensaje, duracion = 2600) {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.classList.add("visible");
  clearTimeout(mostrarToast._t);
  mostrarToast._t = setTimeout(() => toast.classList.remove("visible"), duracion);
}

function anunciar(mensaje) {
  const el = document.getElementById("anuncioSr");
  if (el) el.textContent = mensaje;
}

function inputDate(fecha) {
  return claveFecha(fecha);
}

function parseInputDate(valor) {
  if (!valor) return null;
  const [y, m, d] = valor.split("-").map(Number);
  return crearFecha(y, m, d);
}

// ===========================================================================
// Carga de festivos
// ===========================================================================

function recargarFestivos() {
  estado.festivos = obtenerFestivos("co", estado.anio);
}

// ===========================================================================
// Próximo festivo
// ===========================================================================

function actualizarProximoFestivo() {
  // Busca el próximo festivo desde hoy, incluso si cae en el año siguiente
  let candidatos = obtenerFestivos("co", HOY.getUTCFullYear()).filter((f) => f.fecha >= HOY);

  if (candidatos.length === 0) {
    candidatos = obtenerFestivos("co", HOY.getUTCFullYear() + 1);
  }

  const proximo = candidatos[0];
  if (!proximo) return;

  const diffMs = proximo.fecha - HOY;
  const dias = Math.round(diffMs / 86400000);

  document.getElementById("proximoNombre").textContent = proximo.nombre;
  document.getElementById("contadorDias").textContent = dias === 0 ? "Hoy" : dias;
  document.getElementById("contadorLabel").textContent =
    dias === 0 ? "es festivo" : dias === 1 ? "día" : "días";
}

function actualizarHoyTexto() {
  document.getElementById("hoyTexto").textContent = formatearFechaLarga(HOY);
}

// ===========================================================================
// Vista: Calendario
// ===========================================================================

function renderCalendario() {
  const grid = document.getElementById("calendarioGrid");
  grid.innerHTML = "";

  const clavesFestivos = {};
  estado.festivos.forEach((f) => {
    clavesFestivos[claveFecha(f.fecha)] = f;
  });

  const claveHoy = claveFecha(HOY);
  const mesActual = HOY.getUTCMonth();
  const esAnioActual = estado.anio === HOY.getUTCFullYear();

  for (let mes = 0; mes < 12; mes++) {
    const card = document.createElement("div");
    card.className = "mes-card";
    card.id = `mes-${mes}`;
    if (esAnioActual && mes === mesActual) {
      card.classList.add("mes-actual");
    }

    const titulo = document.createElement("h3");
    titulo.className = "mes-titulo";
    titulo.textContent = MESES[mes];
    card.appendChild(titulo);

    // Contar festivos del mes
    const festivosDelMes = estado.festivos.filter((f) => f.fecha.getUTCMonth() === mes);
    const conteo = document.createElement("span");
    conteo.className = "mes-conteo";
    conteo.textContent = festivosDelMes.length === 0
      ? "Sin festivos"
      : festivosDelMes.length === 1
        ? "1 festivo"
        : `${festivosDelMes.length} festivos`;
    card.appendChild(conteo);

    // Encabezado días de la semana
    const encabezado = document.createElement("div");
    encabezado.className = "mes-dias-semana";
    DIAS_SEMANA_CORTO.forEach((d) => {
      const el = document.createElement("span");
      el.className = "dia-semana";
      el.textContent = d;
      encabezado.appendChild(el);
    });
    card.appendChild(encabezado);

    // Días
    const contenedorDias = document.createElement("div");
    contenedorDias.className = "mes-dias";

    const primerDia = crearFecha(estado.anio, mes + 1, 1);
    const offset = primerDia.getUTCDay();
    const ultimoDia = new Date(Date.UTC(estado.anio, mes + 1, 0)).getUTCDate();

    for (let i = 0; i < offset; i++) {
      const vacio = document.createElement("span");
      vacio.className = "dia vacio";
      contenedorDias.appendChild(vacio);
    }

    for (let d = 1; d <= ultimoDia; d++) {
      const fecha = crearFecha(estado.anio, mes + 1, d);
      const clave = claveFecha(fecha);
      const el = document.createElement("span");
      el.className = "dia";
      el.textContent = d;

      if (esFinDeSemana(fecha)) el.classList.add("finde");

      const festivo = clavesFestivos[clave];
      if (festivo) {
        el.classList.add("festivo");
        el.title = festivo.nombre;
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.addEventListener("click", () => {
          mostrarToast(`${festivo.nombre} · ${formatearFechaLarga(festivo.fecha)}`);
        });
      }

      if (clave === claveHoy) {
        el.classList.add("hoy");
        el.id = "diaHoy";
      }

      contenedorDias.appendChild(el);
    }

    card.appendChild(contenedorDias);
    grid.appendChild(card);
  }

  // Resumen anual
  const puentes = detectarPuentes(estado.festivos);
  document.getElementById("resumenAnual").textContent =
    `${estado.festivos.length} festivos · ${puentes.length} puentes en ${estado.anio}`;
}

function irAHoy() {
  // Si el año mostrado no es el actual, cambiarlo primero
  if (estado.anio !== HOY.getUTCFullYear()) {
    estado.anio = HOY.getUTCFullYear();
    localStorage.setItem(STORAGE.anio, estado.anio);
    sincronizarDropdownAnio();
    recargarFestivos();
    renderTodo();
  }

  // Asegurar que estamos en la vista calendario
  if (estado.vistaActiva !== "calendario") {
    cambiarVista("calendario");
  }

  setTimeout(() => {
    const mesEl = document.getElementById(`mes-${HOY.getUTCMonth()}`);
    if (mesEl) {
      mesEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 120);
}

// ===========================================================================
// Vista: Lista
// ===========================================================================

function renderLista() {
  const contenedor = document.getElementById("listaFestivos");
  contenedor.innerHTML = "";

  let items = estado.festivos;

  if (estado.filtroLista === "proximos") {
    items = items.filter((f) => f.fecha >= HOY);
  } else if (estado.filtroLista === "trasladados") {
    items = items.filter((f) => f.trasladado);
  }

  if (items.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "vista-desc";
    vacio.textContent = "No hay festivos que coincidan con este filtro.";
    contenedor.appendChild(vacio);
    return;
  }

  items.forEach((f) => {
    contenedor.appendChild(crearCardFestivo(f));
  });
}

function crearCardFestivo(f) {
  const card = document.createElement("article");
  card.className = "festivo-card";
  if (f.fecha < HOY) card.classList.add("pasado");

  const bloqueFecha = document.createElement("div");
  bloqueFecha.className = "festivo-fecha";

  const dia = document.createElement("span");
  dia.className = "festivo-dia";
  dia.textContent = f.fecha.getUTCDate();
  bloqueFecha.appendChild(dia);

  const mes = document.createElement("span");
  mes.className = "festivo-mes";
  mes.textContent = MESES[f.fecha.getUTCMonth()].slice(0, 3);
  bloqueFecha.appendChild(mes);

  card.appendChild(bloqueFecha);

  const info = document.createElement("div");
  info.className = "festivo-info";

  const nombre = document.createElement("h3");
  nombre.className = "festivo-nombre";
  nombre.textContent = f.nombre;
  info.appendChild(nombre);

  const meta = document.createElement("div");
  meta.className = "festivo-meta";

  const diaSemana = document.createElement("span");
  diaSemana.textContent = DIAS_SEMANA[f.fecha.getUTCDay()];
  meta.appendChild(diaSemana);

  const d = f.fecha.getUTCDay();
  if (d === 1 || d === 5) {
    const tagPuente = document.createElement("span");
    tagPuente.className = "tag puente";
    tagPuente.textContent = "puente";
    meta.appendChild(tagPuente);
  }

  if (f.trasladado && f.fechaOriginal) {
    const tagTras = document.createElement("span");
    tagTras.className = "tag trasladado";
    tagTras.textContent = `movido del ${f.fechaOriginal.getUTCDate()} ${MESES[f.fechaOriginal.getUTCMonth()].slice(0, 3)}`;
    meta.appendChild(tagTras);
  }

  info.appendChild(meta);
  card.appendChild(info);

  return card;
}

function inicializarFiltrosLista() {
  document.querySelectorAll(".filtro[data-filtro]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filtro[data-filtro]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      estado.filtroLista = btn.dataset.filtro;
      renderLista();
    });
  });
}

// ===========================================================================
// Vista: Puentes
// ===========================================================================

function renderPuentes() {
  const contenedor = document.getElementById("listaPuentes");
  contenedor.innerHTML = "";

  const puentes = detectarPuentes(estado.festivos);

  if (puentes.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "vista-desc";
    vacio.textContent = "No hay puentes este año.";
    contenedor.appendChild(vacio);
    return;
  }

  puentes.forEach((f) => {
    contenedor.appendChild(crearCardFestivo(f));
  });
}

// ===========================================================================
// Vista: Vacaciones
// ===========================================================================

function renderVacaciones() {
  const contenedor = document.getElementById("listaVacaciones");
  contenedor.innerHTML = "";

  const sugerencias = sugerirVacaciones(estado.festivos, estado.anio, 4);

  if (sugerencias.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "vista-desc";
    vacio.textContent = "No se encontraron ventanas especialmente convenientes este año.";
    contenedor.appendChild(vacio);
    return;
  }

  sugerencias.forEach((s) => {
    const card = document.createElement("article");
    card.className = "vacacion-card";

    const ratio = document.createElement("div");
    ratio.className = "vacacion-ratio";
    ratio.textContent = `${s.ratio}x`;
    card.appendChild(ratio);

    const ratioLabel = document.createElement("span");
    ratioLabel.className = "vacacion-ratio-label";
    ratioLabel.textContent = "rendimiento";
    card.appendChild(ratioLabel);

    const nombre = document.createElement("h3");
    nombre.className = "vacacion-nombre";
    nombre.textContent = s.festivo;
    card.appendChild(nombre);

    const detalle = document.createElement("p");
    detalle.className = "vacacion-detalle";
    detalle.textContent = `Pide ${s.diasPedidos} ${s.diasPedidos === 1 ? "día" : "días"} desde el ${formatearFechaLarga(s.inicio)} y descansas ${s.diasLibres} días seguidos.`;
    card.appendChild(detalle);

    contenedor.appendChild(card);
  });
}

// ===========================================================================
// Vista: Días hábiles
// ===========================================================================

function inicializarCalculadora() {
  const inputInicio = document.getElementById("fechaInicio");
  const inputFin = document.getElementById("fechaFin");

  inputInicio.value = inputDate(HOY);
  const finDefecto = sumarDias(HOY, 30);
  inputFin.value = inputDate(finDefecto);

  const calcular = () => {
    const inicio = parseInputDate(inputInicio.value);
    const fin = parseInputDate(inputFin.value);

    if (!inicio || !fin) return;

    if (fin < inicio) {
      document.getElementById("numeroHabiles").textContent = "—";
      document.getElementById("detalleHabiles").textContent = "La fecha final debe ser posterior a la inicial.";
      return;
    }

    // Reunir festivos de todos los años involucrados
    const anioInicio = inicio.getUTCFullYear();
    const anioFin = fin.getUTCFullYear();
    let todosFestivos = [];
    for (let a = anioInicio; a <= anioFin; a++) {
      todosFestivos = todosFestivos.concat(obtenerFestivos("co", a));
    }

    const habiles = contarDiasHabiles(inicio, fin, todosFestivos);
    const totalDias = Math.round((fin - inicio) / 86400000) + 1;
    const festivosEnRango = todosFestivos.filter((f) => f.fecha >= inicio && f.fecha <= fin && !esFinDeSemana(f.fecha));

    document.getElementById("numeroHabiles").textContent = habiles;
    document.getElementById("detalleHabiles").textContent =
      `${totalDias} días naturales · ${festivosEnRango.length} ${festivosEnRango.length === 1 ? "festivo entre semana" : "festivos entre semana"}`;
  };

  inputInicio.addEventListener("change", calcular);
  inputFin.addEventListener("change", calcular);
  calcular();
}

// ===========================================================================
// Vista: Comparador
// ===========================================================================

function renderComparador() {
  const contenedor = document.getElementById("comparadorGrid");
  contenedor.innerHTML = "";

  Object.keys(PAISES).forEach((codigo) => {
    const pais = PAISES[codigo];
    const festivos = obtenerFestivos(codigo, estado.anio);
    const puentes = detectarPuentes(festivos);

    const card = document.createElement("article");
    card.className = "pais-card";
    if (codigo === "co") card.classList.add("destacado");

    const nombre = document.createElement("h3");
    nombre.className = "pais-nombre";
    nombre.textContent = pais.nombre;
    card.appendChild(nombre);

    const numero = document.createElement("div");
    numero.className = "pais-numero";
    numero.textContent = festivos.length;
    card.appendChild(numero);

    const label = document.createElement("span");
    label.className = "pais-label";
    label.textContent = "festivos nacionales";
    card.appendChild(label);

    const detalle = document.createElement("p");
    detalle.className = "pais-puentes";
    detalle.textContent = `${puentes.length} ${puentes.length === 1 ? "puente" : "puentes"} en el año`;
    card.appendChild(detalle);

    contenedor.appendChild(card);
  });
}

// ===========================================================================
// Navegación
// ===========================================================================

function cambiarVista(vista) {
  document.querySelectorAll(".nav-item[data-view]").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
  });
  const btn = document.querySelector(`.nav-item[data-view="${vista}"]`);
  if (btn) {
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
  }
  estado.vistaActiva = vista;

  document.querySelectorAll(".vista").forEach((v) => v.classList.add("hidden"));
  const mapa = {
    calendario: "vistaCalendario",
    lista: "vistaLista",
    puentes: "vistaPuentes",
    vacaciones: "vistaVacaciones",
    habiles: "vistaHabiles",
    comparador: "vistaComparador",
  };
  const target = document.getElementById(mapa[vista]);
  if (target) target.classList.remove("hidden");

  if (vista === "lista") renderLista();
  if (vista === "puentes") renderPuentes();
  if (vista === "vacaciones") renderVacaciones();
  if (vista === "comparador") renderComparador();
}

function inicializarNav() {
  document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => cambiarVista(btn.dataset.view));
  });
}

// ===========================================================================
// Dropdown de año
// ===========================================================================

function construirDropdownAnio() {
  const menu = document.querySelector("#dropdownAnio .dropdown-menu");
  menu.innerHTML = "";
  const anioBase = HOY.getUTCFullYear();
  for (let a = anioBase - 2; a <= anioBase + 4; a++) {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.dataset.value = a;
    li.textContent = a;
    if (a === estado.anio) li.classList.add("selected");
    menu.appendChild(li);
  }
}

function sincronizarDropdownAnio() {
  document.querySelectorAll("#dropdownAnio li").forEach((li) => {
    li.classList.toggle("selected", parseInt(li.dataset.value, 10) === estado.anio);
  });
  document.querySelector("#dropdownAnio .dropdown-value").textContent = estado.anio;
}

function configurarDropdown(id, onChange) {
  const dropdown = document.getElementById(id);
  if (!dropdown) return;
  const toggle = dropdown.querySelector(".dropdown-toggle");
  const menu = dropdown.querySelector(".dropdown-menu");

  menu.addEventListener("click", (e) => {
    e.stopPropagation();
    const li = e.target.closest("li[data-value]");
    if (!li) return;
    const valor = li.dataset.value;

    menu.querySelectorAll("li").forEach((item) => item.classList.remove("selected"));
    li.classList.add("selected");
    toggle.querySelector(".dropdown-value").textContent = li.textContent.trim();

    dropdown.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    onChange(valor);
  });

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const abierto = dropdown.classList.contains("open");
    document.querySelectorAll(".dropdown.open").forEach((d) => {
      if (d !== dropdown) {
        d.classList.remove("open");
        d.querySelector(".dropdown-toggle").setAttribute("aria-expanded", "false");
      }
    });
    dropdown.classList.toggle("open", !abierto);
    toggle.setAttribute("aria-expanded", !abierto);
  });
}

// ===========================================================================
// Tema y PWA
// ===========================================================================

function aplicarTema() {
  document.documentElement.setAttribute("data-theme", estado.tema);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", estado.tema === "claro" ? "#FAFAF7" : "#0A0A0C");
  const icono = document.getElementById("iconoTema");
  if (icono) icono.textContent = estado.tema === "claro" ? "◐" : "◑";
}

let deferredInstallPrompt = null;

function inicializarPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const link = document.getElementById("linkInstall");
    if (link) link.classList.remove("hidden");
  });

  const link = document.getElementById("linkInstall");
  if (link) {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === "accepted") link.classList.add("hidden");
      deferredInstallPrompt = null;
    });
  }
}

// ===========================================================================
// Render general
// ===========================================================================

function renderTodo() {
  renderCalendario();
  if (estado.vistaActiva === "lista") renderLista();
  if (estado.vistaActiva === "puentes") renderPuentes();
  if (estado.vistaActiva === "vacaciones") renderVacaciones();
  if (estado.vistaActiva === "comparador") renderComparador();
}

// ===========================================================================
// Init
// ===========================================================================

function init() {
  const anioFooter = document.getElementById("anioActual");
  if (anioFooter) anioFooter.textContent = HOY.getUTCFullYear();

  aplicarTema();
  actualizarHoyTexto();
  recargarFestivos();
  actualizarProximoFestivo();

  construirDropdownAnio();
  sincronizarDropdownAnio();

  renderCalendario();
  inicializarNav();
  inicializarFiltrosLista();
  inicializarCalculadora();

  configurarDropdown("dropdownAnio", (valor) => {
    estado.anio = parseInt(valor, 10);
    localStorage.setItem(STORAGE.anio, estado.anio);
    recargarFestivos();
    renderTodo();
  });

  document.getElementById("btnTema").addEventListener("click", () => {
    estado.tema = estado.tema === "claro" ? "oscuro" : "claro";
    localStorage.setItem(STORAGE.tema, estado.tema);
    aplicarTema();
  });

  document.getElementById("btnIrHoy").addEventListener("click", irAHoy);

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown.open").forEach((d) => {
        d.classList.remove("open");
        d.querySelector(".dropdown-toggle").setAttribute("aria-expanded", "false");
      });
    }
  });

  inicializarPWA();

  // Al cargar, situarse automáticamente en el mes actual
  if (estado.anio === HOY.getUTCFullYear()) {
    setTimeout(() => {
      const mesEl = document.getElementById(`mes-${HOY.getUTCMonth()}`);
      if (mesEl) {
        mesEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 400);
  }

  console.log("%cFestivos", "font-size: 28px; font-weight: bold; color: #3B82F6;");
  console.log("%cCalendario de días festivos", "font-size: 14px; color: #666;");
  console.log("%chttps://github.com/siestaa42002-code/festivos-colombia-2026", "font-size: 12px; color: #999;");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}