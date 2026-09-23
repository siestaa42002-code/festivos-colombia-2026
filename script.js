/*
  Festivos - Calendario de dias festivos
  Autor: siestaa42002-code
  https://github.com/siestaa42002-code/festivos-colombia-2026
  Licencia: MIT
*/

(function () {
  "use strict";

  // =========================================================================
  // Estado
  // =========================================================================

  var STORAGE = {
    tema: "festivos:tema",
    anio: "festivos:anio",
    installCerrado: "festivos:installCerrado"
  };

  var HOY = hoyEnBogota();

  var estado = {
    tema: leerLS(STORAGE.tema) || "claro",
    anio: parseInt(leerLS(STORAGE.anio), 10) || HOY.getUTCFullYear(),
    vistaActiva: "calendario",
    filtroLista: "todos",
    festivos: []
  };

  function leerLS(clave) {
    try {
      return localStorage.getItem(clave);
    } catch (e) {
      return null;
    }
  }

  function guardarLS(clave, valor) {
    try {
      localStorage.setItem(clave, valor);
    } catch (e) {
      // Modo privado o storage lleno: seguimos sin persistir
    }
  }

  // =========================================================================
  // Helpers de DOM (todos con guard)
  // =========================================================================

  function $(id) {
    return document.getElementById(id);
  }

  function setTexto(id, texto) {
    var el = $(id);
    if (el) el.textContent = texto;
  }

  function onClick(id, fn) {
    var el = $(id);
    if (el) el.addEventListener("click", fn);
  }

  function mostrarToast(mensaje, duracion) {
    var toast = $("toast");
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add("visible");
    clearTimeout(mostrarToast._t);
    mostrarToast._t = setTimeout(function () {
      toast.classList.remove("visible");
    }, duracion || 2600);
  }

  function anunciar(mensaje) {
    setTexto("anuncioSr", mensaje);
  }

  function parseInputDate(valor) {
    if (!valor) return null;
    var partes = valor.split("-");
    if (partes.length !== 3) return null;
    return crearFecha(Number(partes[0]), Number(partes[1]), Number(partes[2]));
  }

  // =========================================================================
  // Carga de datos
  // =========================================================================

  function recargarFestivos() {
    estado.festivos = obtenerFestivos("co", estado.anio);
  }

  // =========================================================================
  // Proximo festivo
  // =========================================================================

  function actualizarProximoFestivo() {
    var candidatos = obtenerFestivos("co", HOY.getUTCFullYear()).filter(function (f) {
      return f.fecha >= HOY;
    });

    if (candidatos.length === 0) {
      candidatos = obtenerFestivos("co", HOY.getUTCFullYear() + 1);
    }

    var proximo = candidatos[0];
    if (!proximo) return;

    var dias = Math.round((proximo.fecha - HOY) / 86400000);

    setTexto("proximoNombre", proximo.nombre);
    setTexto("contadorDias", dias === 0 ? "Hoy" : String(dias));
    setTexto("contadorLabel", dias === 0 ? "es festivo" : dias === 1 ? "dia" : "dias");
  }

  function actualizarHoyTexto() {
    setTexto("hoyTexto", formatearFechaLarga(HOY));
  }

  // =========================================================================
  // Vista 01: Calendario
  // =========================================================================

  function renderCalendario() {
    var grid = $("calendarioGrid");
    if (!grid) return;
    grid.innerHTML = "";

    var mapaFestivos = {};
    estado.festivos.forEach(function (f) {
      mapaFestivos[claveFecha(f.fecha)] = f;
    });

    var claveHoy = claveFecha(HOY);
    var mesActual = HOY.getUTCMonth();
    var esAnioActual = estado.anio === HOY.getUTCFullYear();

    for (var mes = 0; mes < 12; mes++) {
      var card = document.createElement("div");
      card.className = "mes-card";
      card.id = "mes-" + mes;
      if (esAnioActual && mes === mesActual) card.classList.add("mes-actual");

      var titulo = document.createElement("h3");
      titulo.className = "mes-titulo";
      titulo.textContent = MESES[mes];
      card.appendChild(titulo);

      var delMes = estado.festivos.filter(function (f) {
        return f.fecha.getUTCMonth() === this.m;
      }, { m: mes });

      var conteo = document.createElement("span");
      conteo.className = "mes-conteo";
      conteo.textContent =
        delMes.length === 0 ? "Sin festivos" :
        delMes.length === 1 ? "1 festivo" :
        delMes.length + " festivos";
      card.appendChild(conteo);

      var encabezado = document.createElement("div");
      encabezado.className = "mes-dias-semana";
      DIAS_SEMANA_CORTO.forEach(function (d) {
        var el = document.createElement("span");
        el.className = "dia-semana";
        el.textContent = d;
        encabezado.appendChild(el);
      });
      card.appendChild(encabezado);

      var contenedorDias = document.createElement("div");
      contenedorDias.className = "mes-dias";

      var offset = crearFecha(estado.anio, mes + 1, 1).getUTCDay();
      var ultimoDia = new Date(Date.UTC(estado.anio, mes + 1, 0)).getUTCDate();

      for (var i = 0; i < offset; i++) {
        var vacio = document.createElement("span");
        vacio.className = "dia vacio";
        contenedorDias.appendChild(vacio);
      }

      for (var d = 1; d <= ultimoDia; d++) {
        contenedorDias.appendChild(crearDia(estado.anio, mes + 1, d, mapaFestivos, claveHoy));
      }

      card.appendChild(contenedorDias);
      grid.appendChild(card);
    }

    var puentes = detectarPuentes(estado.festivos);
    setTexto("resumenAnual",
      estado.festivos.length + " festivos y " + puentes.length + " puentes en " + estado.anio);
  }

  function crearDia(anio, mes, dia, mapaFestivos, claveHoy) {
    var fecha = crearFecha(anio, mes, dia);
    var clave = claveFecha(fecha);
    var festivo = mapaFestivos[clave];

    var el = document.createElement(festivo ? "button" : "span");
    el.className = "dia";
    el.textContent = String(dia);

    if (esFinDeSemana(fecha)) el.classList.add("finde");
    if (clave === claveHoy) el.classList.add("hoy");

    if (festivo) {
      el.type = "button";
      el.classList.add("festivo");
      el.title = festivo.nombre;
      el.setAttribute("aria-label", festivo.nombre + ", " + formatearFechaLarga(fecha));
      el.addEventListener("click", function () {
        mostrarToast(festivo.nombre + " - " + formatearFechaLarga(festivo.fecha));
      });
    }

    return el;
  }

  function irAHoy() {
    if (estado.anio !== HOY.getUTCFullYear()) {
      estado.anio = HOY.getUTCFullYear();
      guardarLS(STORAGE.anio, estado.anio);
      sincronizarDropdownAnio();
      recargarFestivos();
      renderVistaActual();
      renderCalendario();
    }

    if (estado.vistaActiva !== "calendario") {
      cambiarVista("calendario");
    }

    setTimeout(desplazarAlMesActual, 150);
  }

  function desplazarAlMesActual() {
    if (estado.anio !== HOY.getUTCFullYear()) return;
    var mesEl = $("mes-" + HOY.getUTCMonth());
    if (!mesEl) return;
    try {
      mesEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {
      mesEl.scrollIntoView();
    }
  }

  // =========================================================================
  // Vista 02: Lista
  // =========================================================================

  function renderLista() {
    var contenedor = $("listaFestivos");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    var items = estado.festivos;

    if (estado.filtroLista === "proximos") {
      items = items.filter(function (f) { return f.fecha >= HOY; });
    } else if (estado.filtroLista === "trasladados") {
      items = items.filter(function (f) { return f.trasladado; });
    }

    if (items.length === 0) {
      contenedor.appendChild(mensajeVacio("No hay festivos que coincidan con este filtro."));
      return;
    }

    items.forEach(function (f) {
      contenedor.appendChild(crearCardFestivo(f));
    });
  }

  function mensajeVacio(texto) {
    var p = document.createElement("p");
    p.className = "mensaje-vacio";
    p.textContent = texto;
    return p;
  }

  function crearCardFestivo(f) {
    var card = document.createElement("article");
    card.className = "festivo-card";
    if (f.fecha < HOY) card.classList.add("pasado");

    var bloqueFecha = document.createElement("div");
    bloqueFecha.className = "festivo-fecha";

    var dia = document.createElement("span");
    dia.className = "festivo-dia";
    dia.textContent = String(f.fecha.getUTCDate());
    bloqueFecha.appendChild(dia);

    var mes = document.createElement("span");
    mes.className = "festivo-mes";
    mes.textContent = MESES[f.fecha.getUTCMonth()].slice(0, 3);
    bloqueFecha.appendChild(mes);

    card.appendChild(bloqueFecha);

    var info = document.createElement("div");
    info.className = "festivo-info";

    var nombre = document.createElement("h3");
    nombre.className = "festivo-nombre";
    nombre.textContent = f.nombre;
    info.appendChild(nombre);

    var meta = document.createElement("div");
    meta.className = "festivo-meta";

    var diaSemana = document.createElement("span");
    diaSemana.textContent = DIAS_SEMANA[f.fecha.getUTCDay()];
    meta.appendChild(diaSemana);

    var d = f.fecha.getUTCDay();
    if (d === 1 || d === 5) {
      var tagPuente = document.createElement("span");
      tagPuente.className = "tag puente";
      tagPuente.textContent = "puente";
      meta.appendChild(tagPuente);
    }

    if (f.trasladado && f.fechaOriginal) {
      var tagTras = document.createElement("span");
      tagTras.className = "tag trasladado";
      tagTras.textContent = "movido del " + f.fechaOriginal.getUTCDate() + " " +
        MESES[f.fechaOriginal.getUTCMonth()].slice(0, 3);
      meta.appendChild(tagTras);
    }

    info.appendChild(meta);
    card.appendChild(info);

    return card;
  }

  function inicializarFiltrosLista() {
    var botones = document.querySelectorAll(".filtro[data-filtro]");
    Array.prototype.forEach.call(botones, function (btn) {
      btn.addEventListener("click", function () {
        Array.prototype.forEach.call(botones, function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        estado.filtroLista = btn.getAttribute("data-filtro");
        renderLista();
      });
    });
  }

  // =========================================================================
  // Vista 03: Puentes
  // =========================================================================

  function renderPuentes() {
    var contenedor = $("listaPuentes");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    var puentes = detectarPuentes(estado.festivos);

    if (puentes.length === 0) {
      contenedor.appendChild(mensajeVacio("No hay puentes este anio."));
      return;
    }

    puentes.forEach(function (f) {
      contenedor.appendChild(crearCardFestivo(f));
    });
  }

  // =========================================================================
  // Vista 04: Vacaciones
  // =========================================================================

  function renderVacaciones() {
    var contenedor = $("listaVacaciones");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    var sugerencias = sugerirVacaciones(estado.festivos, estado.anio, 4);

    if (sugerencias.length === 0) {
      contenedor.appendChild(mensajeVacio("No se encontraron ventanas especialmente convenientes este anio."));
      return;
    }

    sugerencias.forEach(function (s) {
      var card = document.createElement("article");
      card.className = "vacacion-card";

      var ratio = document.createElement("div");
      ratio.className = "vacacion-ratio";
      ratio.textContent = s.ratio + "x";
      card.appendChild(ratio);

      var ratioLabel = document.createElement("span");
      ratioLabel.className = "vacacion-ratio-label";
      ratioLabel.textContent = "rendimiento";
      card.appendChild(ratioLabel);

      var nombre = document.createElement("h3");
      nombre.className = "vacacion-nombre";
      nombre.textContent = s.festivo;
      card.appendChild(nombre);

      var detalle = document.createElement("p");
      detalle.className = "vacacion-detalle";
      detalle.textContent = "Pide " + s.diasPedidos + (s.diasPedidos === 1 ? " dia" : " dias") +
        " y descansas " + s.diasLibres + " seguidos.";
      card.appendChild(detalle);

      var rango = document.createElement("p");
      rango.className = "vacacion-rango";
      rango.textContent = formatearCorto(s.inicio) + " a " + formatearCorto(s.fin);
      card.appendChild(rango);

      contenedor.appendChild(card);
    });
  }

  function formatearCorto(fecha) {
    return fecha.getUTCDate() + " " + MESES[fecha.getUTCMonth()].slice(0, 3);
  }

  // =========================================================================
  // Vista 05: Dias habiles
  // =========================================================================

  function inicializarCalculadora() {
    var inputInicio = $("fechaInicio");
    var inputFin = $("fechaFin");
    if (!inputInicio || !inputFin) return;

    inputInicio.value = claveFecha(HOY);
    inputFin.value = claveFecha(sumarDias(HOY, 30));

    function calcular() {
      var inicio = parseInputDate(inputInicio.value);
      var fin = parseInputDate(inputFin.value);

      if (!inicio || !fin) {
        setTexto("numeroHabiles", "-");
        setTexto("detalleHabiles", "");
        return;
      }

      if (fin < inicio) {
        setTexto("numeroHabiles", "-");
        setTexto("detalleHabiles", "La fecha final debe ser posterior a la inicial.");
        return;
      }

      var anioInicio = inicio.getUTCFullYear();
      var anioFin = fin.getUTCFullYear();

      if (anioFin - anioInicio > 20) {
        setTexto("numeroHabiles", "-");
        setTexto("detalleHabiles", "El rango es demasiado amplio. Usa menos de 20 anios.");
        return;
      }

      var todos = [];
      for (var a = anioInicio; a <= anioFin; a++) {
        todos = todos.concat(obtenerFestivos("co", a));
      }

      var habiles = contarDiasHabiles(inicio, fin, todos);
      var totalDias = Math.round((fin - inicio) / 86400000) + 1;
      var festivosEnRango = todos.filter(function (f) {
        return f.fecha >= inicio && f.fecha <= fin && !esFinDeSemana(f.fecha);
      });

      setTexto("numeroHabiles", String(habiles));
      setTexto("detalleHabiles",
        totalDias + " dias naturales y " + festivosEnRango.length +
        (festivosEnRango.length === 1 ? " festivo entre semana" : " festivos entre semana"));
    }

    inputInicio.addEventListener("change", calcular);
    inputInicio.addEventListener("input", calcular);
    inputFin.addEventListener("change", calcular);
    inputFin.addEventListener("input", calcular);
    calcular();
  }

  // =========================================================================
  // Vista 06: Comparador
  // =========================================================================

  function renderComparador() {
    var contenedor = $("comparadorGrid");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    Object.keys(PAISES).forEach(function (codigo) {
      var pais = PAISES[codigo];
      var festivos = obtenerFestivos(codigo, estado.anio);
      var puentes = detectarPuentes(festivos);

      var card = document.createElement("article");
      card.className = "pais-card";
      if (codigo === "co") card.classList.add("destacado");

      var nombre = document.createElement("h3");
      nombre.className = "pais-nombre";
      nombre.textContent = pais.nombre;
      card.appendChild(nombre);

      var numero = document.createElement("div");
      numero.className = "pais-numero";
      numero.textContent = String(festivos.length);
      card.appendChild(numero);

      var label = document.createElement("span");
      label.className = "pais-label";
      label.textContent = "festivos nacionales";
      card.appendChild(label);

      var detalle = document.createElement("p");
      detalle.className = "pais-puentes";
      detalle.textContent = puentes.length + (puentes.length === 1 ? " puente" : " puentes") + " en el anio";
      card.appendChild(detalle);

      contenedor.appendChild(card);
    });
  }

  // =========================================================================
  // Navegacion
  // =========================================================================

  var MAPA_VISTAS = {
    calendario: "vistaCalendario",
    lista: "vistaLista",
    puentes: "vistaPuentes",
    vacaciones: "vistaVacaciones",
    habiles: "vistaHabiles",
    comparador: "vistaComparador"
  };

  function cambiarVista(vista) {
    if (!MAPA_VISTAS[vista]) return;

    var items = document.querySelectorAll(".nav-item[data-view]");
    Array.prototype.forEach.call(items, function (b) {
      var activo = b.getAttribute("data-view") === vista;
      b.classList.toggle("active", activo);
      b.setAttribute("aria-selected", activo ? "true" : "false");
    });

    estado.vistaActiva = vista;

    var vistas = document.querySelectorAll(".vista");
    Array.prototype.forEach.call(vistas, function (v) {
      v.classList.add("hidden");
    });

    var target = $(MAPA_VISTAS[vista]);
    if (target) target.classList.remove("hidden");

    renderVistaActual();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderVistaActual() {
    if (estado.vistaActiva === "lista") renderLista();
    else if (estado.vistaActiva === "puentes") renderPuentes();
    else if (estado.vistaActiva === "vacaciones") renderVacaciones();
    else if (estado.vistaActiva === "comparador") renderComparador();
  }

  function inicializarNav() {
    var items = document.querySelectorAll(".nav-item[data-view]");
    Array.prototype.forEach.call(items, function (btn) {
      btn.addEventListener("click", function () {
        cambiarVista(btn.getAttribute("data-view"));
      });
    });
  }

  // =========================================================================
  // Dropdown de anio
  // =========================================================================

  function construirDropdownAnio() {
    var menu = document.querySelector("#dropdownAnio .dropdown-menu");
    if (!menu) return;
    menu.innerHTML = "";
    var base = HOY.getUTCFullYear();
    for (var a = base - 2; a <= base + 4; a++) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("data-value", String(a));
      li.textContent = String(a);
      if (a === estado.anio) li.classList.add("selected");
      menu.appendChild(li);
    }
  }

  function sincronizarDropdownAnio() {
    var items = document.querySelectorAll("#dropdownAnio li");
    Array.prototype.forEach.call(items, function (li) {
      li.classList.toggle("selected", parseInt(li.getAttribute("data-value"), 10) === estado.anio);
    });
    var valor = document.querySelector("#dropdownAnio .dropdown-value");
    if (valor) valor.textContent = String(estado.anio);
  }

  function configurarDropdown(id, onChange) {
    var dropdown = $(id);
    if (!dropdown) return;
    var toggle = dropdown.querySelector(".dropdown-toggle");
    var menu = dropdown.querySelector(".dropdown-menu");
    if (!toggle || !menu) return;

    menu.addEventListener("click", function (e) {
      e.stopPropagation();
      var li = e.target.closest ? e.target.closest("li[data-value]") : null;
      if (!li) return;

      var items = menu.querySelectorAll("li");
      Array.prototype.forEach.call(items, function (item) {
        item.classList.remove("selected");
      });
      li.classList.add("selected");

      var valorEl = toggle.querySelector(".dropdown-value");
      if (valorEl) valorEl.textContent = li.textContent.trim();

      dropdown.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");

      onChange(li.getAttribute("data-value"));
    });

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var abierto = dropdown.classList.contains("open");
      var abiertos = document.querySelectorAll(".dropdown.open");
      Array.prototype.forEach.call(abiertos, function (d) {
        if (d !== dropdown) {
          d.classList.remove("open");
          var t = d.querySelector(".dropdown-toggle");
          if (t) t.setAttribute("aria-expanded", "false");
        }
      });
      dropdown.classList.toggle("open", !abierto);
      toggle.setAttribute("aria-expanded", abierto ? "false" : "true");
    });
  }

  // =========================================================================
  // Tema
  // =========================================================================

  function aplicarTema() {
    document.documentElement.setAttribute("data-theme", estado.tema);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", estado.tema === "claro" ? "#FAFAF7" : "#0A0A0C");
    setTexto("iconoTema", estado.tema === "claro" ? "\u25D0" : "\u25D1");
  }

  // =========================================================================
  // PWA e instalacion
  // =========================================================================

  var promptInstalacion = null;

  function esStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function esIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function mostrarBannerInstalacion() {
    if (leerLS(STORAGE.installCerrado) === "si") return;
    if (esStandalone()) return;
    var banner = $("installBanner");
    if (banner) banner.classList.remove("hidden");
  }

  function ocultarBannerInstalacion() {
    var banner = $("installBanner");
    if (banner) banner.classList.add("hidden");
  }

  function inicializarPWA() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      promptInstalacion = e;
      mostrarBannerInstalacion();
      var link = $("linkInstall");
      if (link) link.classList.remove("hidden");
    });

    window.addEventListener("appinstalled", function () {
      promptInstalacion = null;
      ocultarBannerInstalacion();
      var link = $("linkInstall");
      if (link) link.classList.add("hidden");
      mostrarToast("Instalada. Ya puedes abrirla desde tu pantalla de inicio.");
    });

    // iOS no dispara beforeinstallprompt: mostramos instrucciones
    if (esIOS() && !esStandalone()) {
      setTexto("installTitulo", "Anadir a la pantalla de inicio");
      setTexto("installDesc", "Toca el boton Compartir y luego Anadir a inicio.");
      var btn = $("btnInstalar");
      if (btn) btn.textContent = "Como hacerlo";
      mostrarBannerInstalacion();
    }

    onClick("btnInstalar", instalarApp);
    onClick("linkInstall", function (e) {
      e.preventDefault();
      instalarApp();
    });
    onClick("btnCerrarInstall", function () {
      ocultarBannerInstalacion();
      guardarLS(STORAGE.installCerrado, "si");
    });
  }

  function instalarApp() {
    if (esIOS()) {
      mostrarToast("En iPhone: boton Compartir y luego Anadir a pantalla de inicio.", 5000);
      return;
    }

    if (!promptInstalacion) {
      mostrarToast("Usa el menu del navegador y elige Instalar aplicacion.", 4500);
      return;
    }

    promptInstalacion.prompt();
    promptInstalacion.userChoice.then(function (resultado) {
      if (resultado && resultado.outcome === "accepted") {
        ocultarBannerInstalacion();
      }
      promptInstalacion = null;
    }).catch(function () {
      promptInstalacion = null;
    });
  }

  // =========================================================================
  // Init
  // =========================================================================

  function init() {
    try {
      setTexto("anioActual", String(HOY.getUTCFullYear()));
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

      configurarDropdown("dropdownAnio", function (valor) {
        estado.anio = parseInt(valor, 10);
        guardarLS(STORAGE.anio, estado.anio);
        recargarFestivos();
        renderCalendario();
        renderVistaActual();
        anunciar("Anio cambiado a " + estado.anio);
      });

      onClick("btnTema", function () {
        estado.tema = estado.tema === "claro" ? "oscuro" : "claro";
        guardarLS(STORAGE.tema, estado.tema);
        aplicarTema();
      });

      onClick("btnIrHoy", irAHoy);

      document.addEventListener("click", function (e) {
        if (!e.target.closest || !e.target.closest(".dropdown")) {
          var abiertos = document.querySelectorAll(".dropdown.open");
          Array.prototype.forEach.call(abiertos, function (d) {
            d.classList.remove("open");
            var t = d.querySelector(".dropdown-toggle");
            if (t) t.setAttribute("aria-expanded", "false");
          });
        }
      });

      inicializarPWA();

      // Al abrir, situarse en el mes actual
      setTimeout(desplazarAlMesActual, 450);

      console.log("%cFestivos", "font-size: 26px; font-weight: bold; color: #3B82F6;");
      console.log("%chttps://github.com/siestaa42002-code/festivos-colombia-2026", "font-size: 12px; color: #999;");
    } catch (err) {
      console.error("Error al iniciar Festivos:", err);
      mostrarToast("Hubo un error al cargar. Recarga la pagina.", 5000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
