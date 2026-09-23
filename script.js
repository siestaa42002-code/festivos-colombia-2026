/*
  Festivos · Calendario de días festivos y eventos personales
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
    installCerrado: "festivos:installCerrado",
    notisOmitidas: "festivos:notisOmitidas"
  };

  var HOY = hoyEnBogota();

  var estado = {
    tema: leerLS(STORAGE.tema) || "claro",
    anio: parseInt(leerLS(STORAGE.anio), 10) || HOY.getUTCFullYear(),
    vistaActiva: "calendario",
    filtroAgenda: "todo",
    festivos: [],
    eventos: [],
    editandoId: null,
    categoriaSel: "personal",
    fechaModalDia: null,
    buscando: false
  };

  function leerLS(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
  }

  function guardarLS(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch (e) {}
  }

  // =========================================================================
  // Helpers de DOM
  // =========================================================================

  function $(id) { return document.getElementById(id); }

  function setTexto(id, texto) {
    var el = $(id);
    if (el) el.textContent = texto;
  }

  function onClick(id, fn) {
    var el = $(id);
    if (el) el.addEventListener("click", fn);
  }

  function mostrar(id) {
    var el = $(id);
    if (el) el.classList.remove("hidden");
  }

  function ocultar(id) {
    var el = $(id);
    if (el) el.classList.add("hidden");
  }

  function mostrarToast(mensaje, duracion) {
    var toast = $("toast");
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add("visible");
    clearTimeout(mostrarToast._t);
    mostrarToast._t = setTimeout(function () {
      toast.classList.remove("visible");
    }, duracion || 2800);
  }

  function anunciar(mensaje) { setTexto("anuncioSr", mensaje); }

  function parseInputDate(valor) {
    if (!valor) return null;
    var p = valor.split("-");
    if (p.length !== 3) return null;
    return crearFecha(Number(p[0]), Number(p[1]), Number(p[2]));
  }

  function formatearCorto(fecha) {
    return fecha.getUTCDate() + " " + MESES[fecha.getUTCMonth()].slice(0, 3);
  }

  function limpiar(el) {
    if (el) el.innerHTML = "";
  }

  // =========================================================================
  // Carga de datos
  // =========================================================================

  function recargarDatos() {
    estado.festivos = obtenerFestivos("co", estado.anio);
    estado.eventos = Eventos.delAnio(estado.anio);
    actualizarBadges();
  }

  function actualizarBadges() {
    var badge = $("badgeEventos");
    if (!badge) return;
    var total = Eventos.cargar().length;
    if (total > 0) {
      badge.textContent = String(total);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  // =========================================================================
  // Próximo festivo
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
    setTexto("contadorLabel", dias === 0 ? "es festivo" : dias === 1 ? "día" : "días");
  }

  // =========================================================================
  // Vista 01: Calendario
  // =========================================================================

  function renderCalendario() {
    var grid = $("calendarioGrid");
    if (!grid) return;
    limpiar(grid);

    var mapaFestivos = {};
    estado.festivos.forEach(function (f) {
      mapaFestivos[claveFecha(f.fecha)] = f;
    });

    var mapaEventos = {};
    estado.eventos.forEach(function (e) {
      Eventos.diasDelEvento(e).forEach(function (dia, indice) {
        var k = claveFecha(dia);
        if (!mapaEventos[k]) mapaEventos[k] = [];
        mapaEventos[k].push({
          evento: e,
          esInicio: indice === 0,
          esFin: indice === (e.duracionDias || 0),
          enMedio: indice > 0 && indice < (e.duracionDias || 0)
        });
      });
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

      var mesRef = mes;
      var festivosMes = estado.festivos.filter(function (f) {
        return f.fecha.getUTCMonth() === mesRef;
      });
      var eventosMes = estado.eventos.filter(function (e) {
        return Eventos.diasDelEvento(e).some(function (d) {
          return d.getUTCMonth() === mesRef && d.getUTCFullYear() === estado.anio;
        });
      });

      var partes = [];
      if (festivosMes.length) partes.push(festivosMes.length + (festivosMes.length === 1 ? " festivo" : " festivos"));
      if (eventosMes.length) partes.push(eventosMes.length + (eventosMes.length === 1 ? " evento" : " eventos"));

      var conteo = document.createElement("span");
      conteo.className = "mes-conteo";
      conteo.textContent = partes.length ? partes.join(" · ") : "Sin nada marcado";
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
        contenedorDias.appendChild(crearDia(estado.anio, mes + 1, d, mapaFestivos, mapaEventos, claveHoy));
      }

      card.appendChild(contenedorDias);
      grid.appendChild(card);
    }

    var puentes = detectarPuentes(estado.festivos);
    var resumen = estado.festivos.length + " festivos y " + puentes.length + " puentes en " + estado.anio;
    if (estado.eventos.length) {
      resumen += " · " + estado.eventos.length + (estado.eventos.length === 1 ? " evento tuyo" : " eventos tuyos");
    }
    setTexto("resumenAnual", resumen);
  }

  function crearDia(anio, mes, dia, mapaFestivos, mapaEventos, claveHoy) {
    var fecha = crearFecha(anio, mes, dia);
    var clave = claveFecha(fecha);
    var festivo = mapaFestivos[clave];
    var entradas = mapaEventos[clave] || [];

    var el = document.createElement("button");
    el.type = "button";
    el.className = "dia";
    el.textContent = String(dia);

    if (esFinDeSemana(fecha)) el.classList.add("finde");
    if (clave === claveHoy) el.classList.add("hoy");
    if (festivo) el.classList.add("festivo");

    if (entradas.length) {
      el.classList.add("con-evento");

      // Pintar la continuidad del rango. Un festivo dentro del rango
      // conserva su azul sólido, pero mantiene los bordes alineados.
      var hayRango = entradas.some(function (x) { return x.evento.esRango; });
      if (hayRango) {
        el.classList.add("en-rango");
        var soloInicio = entradas.every(function (x) { return !x.evento.esRango || x.esInicio; });
        var soloFin = entradas.every(function (x) { return !x.evento.esRango || x.esFin; });
        var enMedio = entradas.some(function (x) { return x.enMedio; });
        if (enMedio) el.classList.add("rango-medio");
        else if (soloInicio) el.classList.add("rango-inicio");
        else if (soloFin) el.classList.add("rango-fin");
      }

      var marcas = document.createElement("span");
      marcas.className = "dia-marcas";
      entradas.slice(0, 3).forEach(function (x) {
        var punto = document.createElement("span");
        punto.className = "dia-marca";
        var cat = Eventos.CATEGORIAS[x.evento.categoria] || Eventos.CATEGORIAS.otro;
        punto.style.background = cat.color;
        marcas.appendChild(punto);
      });
      el.appendChild(marcas);
    }

    var etiquetas = [formatearFechaLarga(fecha)];
    if (festivo) etiquetas.push(festivo.nombre);
    entradas.forEach(function (x) { etiquetas.push(x.evento.titulo); });
    el.setAttribute("aria-label", etiquetas.join(", "));
    if (festivo) el.title = festivo.nombre;

    el.addEventListener("click", function () {
      abrirModalDia(fecha, festivo, entradas.map(function (x) { return x.evento; }));
    });

    return el;
  }

  function irAHoy() {
    if (estado.anio !== HOY.getUTCFullYear()) {
      estado.anio = HOY.getUTCFullYear();
      guardarLS(STORAGE.anio, estado.anio);
      sincronizarDropdownAnio();
      recargarDatos();
      renderCalendario();
      renderVistaActual();
    }
    if (estado.vistaActiva !== "calendario") cambiarVista("calendario");
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
  // Modal de día
  // =========================================================================

  function abrirModalDia(fecha, festivo, eventos) {
    estado.fechaModalDia = fecha;
    setTexto("modalDiaTitulo", formatearFechaLarga(fecha));

    var cuerpo = $("modalDiaCuerpo");
    limpiar(cuerpo);

    if (festivo) {
      var secF = document.createElement("div");
      secF.className = "dia-seccion";
      var tF = document.createElement("p");
      tF.className = "dia-seccion-titulo";
      tF.textContent = "Festivo";
      secF.appendChild(tF);

      var itemF = document.createElement("div");
      itemF.className = "dia-item";
      var puntoF = document.createElement("span");
      puntoF.className = "dia-item-punto";
      puntoF.style.background = "var(--azul)";
      itemF.appendChild(puntoF);

      var textoF = document.createElement("span");
      textoF.textContent = festivo.nombre;
      itemF.appendChild(textoF);
      itemF.style.cursor = "default";
      secF.appendChild(itemF);

      if (festivo.trasladado && festivo.fechaOriginal) {
        var nota = document.createElement("p");
        nota.className = "dia-vacio-texto";
        nota.style.marginTop = "0.5rem";
        nota.textContent = "Trasladado desde el " + formatearCorto(festivo.fechaOriginal) + " por la Ley Emiliani.";
        secF.appendChild(nota);
      }
      cuerpo.appendChild(secF);
    }

    var secE = document.createElement("div");
    secE.className = "dia-seccion";
    var tE = document.createElement("p");
    tE.className = "dia-seccion-titulo";
    tE.textContent = "Tus eventos";
    secE.appendChild(tE);

    if (eventos && eventos.length) {
      eventos.forEach(function (ev) {
        var item = document.createElement("button");
        item.type = "button";
        item.className = "dia-item";

        var punto = document.createElement("span");
        punto.className = "dia-item-punto";
        var cat = Eventos.CATEGORIAS[ev.categoria] || Eventos.CATEGORIAS.otro;
        punto.style.background = cat.color;
        item.appendChild(punto);

        var texto = document.createElement("span");
        var t = ev.titulo;
        if (ev.edad) t += " (" + ev.edad + ")";
        if (!ev.todoElDia && ev.hora) t += " · " + ev.hora;
        else if (ev.esRango) t += " · " + (ev.duracionDias + 1) + " días";
        texto.textContent = t;
        item.appendChild(texto);

        item.addEventListener("click", function () {
          cerrarModalDia();
          abrirModalEvento(ev.id);
        });
        secE.appendChild(item);
      });
    } else {
      var vacio = document.createElement("p");
      vacio.className = "dia-vacio-texto";
      vacio.textContent = "Nada marcado para este día.";
      secE.appendChild(vacio);
    }

    cuerpo.appendChild(secE);
    mostrar("modalDia");
  }

  function cerrarModalDia() {
    ocultar("modalDia");
    estado.fechaModalDia = null;
  }

  // =========================================================================
  // Componente de rueda (selector tipo picker)
  // =========================================================================

  var ALTURA_ITEM = 38;

  function crearRueda(unidad, valorInicial, alCambiar) {
    var rueda = document.createElement("div");
    rueda.className = "rueda";
    rueda.setAttribute("data-unidad", unidad.clave);

    var label = document.createElement("div");
    label.className = "rueda-label";
    label.textContent = unidad.etiqueta;
    rueda.appendChild(label);

    var scroll = document.createElement("div");
    scroll.className = "rueda-scroll";
    scroll.setAttribute("role", "listbox");
    scroll.setAttribute("aria-label", unidad.etiqueta);
    scroll.setAttribute("tabindex", "0");

    var valores = [];
    for (var v = 0; v <= unidad.max; v += unidad.paso) valores.push(v);

    valores.forEach(function (valor, i) {
      var item = document.createElement("div");
      item.className = "rueda-item";
      item.textContent = String(valor);
      item.setAttribute("data-valor", String(valor));
      item.setAttribute("data-indice", String(i));
      item.setAttribute("role", "option");
      item.addEventListener("click", function () {
        irAIndice(i, true);
      });
      scroll.appendChild(item);
    });

    rueda.appendChild(scroll);

    var indiceActual = Math.max(0, valores.indexOf(valorInicial));
    var temporizador = null;
    var ignorarScroll = false;

    function pintar(indice) {
      var items = scroll.querySelectorAll(".rueda-item");
      Array.prototype.forEach.call(items, function (it, i) {
        it.classList.toggle("seleccionado", i === indice);
        it.classList.toggle("adyacente", Math.abs(i - indice) === 1);
        it.setAttribute("aria-selected", i === indice ? "true" : "false");
      });
    }

    function irAIndice(indice, suave) {
      indice = Math.max(0, Math.min(valores.length - 1, indice));
      indiceActual = indice;
      ignorarScroll = true;
      try {
        scroll.scrollTo({ top: indice * ALTURA_ITEM, behavior: suave ? "smooth" : "auto" });
      } catch (e) {
        scroll.scrollTop = indice * ALTURA_ITEM;
      }
      pintar(indice);
      setTimeout(function () { ignorarScroll = false; }, suave ? 320 : 40);
      if (alCambiar) alCambiar(valores[indice]);
    }

    scroll.addEventListener("scroll", function () {
      if (ignorarScroll) return;
      var indice = Math.round(scroll.scrollTop / ALTURA_ITEM);
      indice = Math.max(0, Math.min(valores.length - 1, indice));
      if (indice !== indiceActual) {
        indiceActual = indice;
        pintar(indice);
      }
      clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        if (alCambiar) alCambiar(valores[indiceActual]);
      }, 110);
    });

    scroll.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        irAIndice(indiceActual + 1, true);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        irAIndice(indiceActual - 1, true);
      } else if (e.key === "Home") {
        e.preventDefault();
        irAIndice(0, true);
      } else if (e.key === "End") {
        e.preventDefault();
        irAIndice(valores.length - 1, true);
      }
    });

    // API de la rueda
    rueda.api = {
      valor: function () { return valores[indiceActual]; },
      fijar: function (valor, suave) {
        var i = valores.indexOf(valor);
        if (i === -1) {
          // Buscar el más cercano
          var mejor = 0, dif = Infinity;
          valores.forEach(function (v, k) {
            var d = Math.abs(v - valor);
            if (d < dif) { dif = d; mejor = k; }
          });
          i = mejor;
        }
        irAIndice(i, suave === true);
      },
      refrescar: function () {
        ignorarScroll = true;
        scroll.scrollTop = indiceActual * ALTURA_ITEM;
        pintar(indiceActual);
        setTimeout(function () { ignorarScroll = false; }, 40);
      }
    };

    pintar(indiceActual);
    return rueda;
  }

  var ruedas = {};

  function construirRuedas() {
    var cont = $("ruedasRecordatorio");
    if (!cont) return;
    limpiar(cont);
    ruedas = {};

    Eventos.UNIDADES.forEach(function (unidad) {
      var rueda = crearRueda(unidad, 0, function () {
        actualizarResumenRecordatorio();
        marcarAtajoCoincidente();
      });
      ruedas[unidad.clave] = rueda;
      cont.appendChild(rueda);
    });
  }

  function leerRuedas() {
    var r = { activo: true };
    Eventos.UNIDADES.forEach(function (u) {
      r[u.clave] = ruedas[u.clave] ? ruedas[u.clave].api.valor() : 0;
    });
    return r;
  }

  function fijarRuedas(recordatorio, suave) {
    Eventos.UNIDADES.forEach(function (u) {
      if (ruedas[u.clave]) ruedas[u.clave].api.fijar(recordatorio[u.clave] || 0, suave);
    });
    actualizarResumenRecordatorio();
    marcarAtajoCoincidente();
  }

  function refrescarRuedas() {
    Eventos.UNIDADES.forEach(function (u) {
      if (ruedas[u.clave]) ruedas[u.clave].api.refrescar();
    });
  }

  function actualizarResumenRecordatorio() {
    var r = leerRuedas();
    var total = Eventos.recordatorioEnMinutos(r);
    var el = $("recordatorioResumen");
    if (!el) return;

    if (total === 0) {
      el.textContent = "Justo a la hora del evento";
      return;
    }
    el.textContent = "Aviso " + Eventos.textoRecordatorio(r);
  }

  function construirAtajos() {
    var cont = $("atajosRecordatorio");
    if (!cont) return;
    limpiar(cont);

    Eventos.ATAJOS.forEach(function (atajo, i) {
      if (!atajo.valor) return; // "Sin aviso" se maneja con el interruptor
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "atajo-btn";
      btn.textContent = atajo.texto;
      btn.setAttribute("data-atajo", String(i));
      btn.addEventListener("click", function () {
        fijarRuedas(atajo.valor, true);
      });
      cont.appendChild(btn);
    });
  }

  function marcarAtajoCoincidente() {
    var actual = leerRuedas();
    var botones = document.querySelectorAll(".atajo-btn");
    Array.prototype.forEach.call(botones, function (btn) {
      var i = parseInt(btn.getAttribute("data-atajo"), 10);
      var atajo = Eventos.ATAJOS[i];
      if (!atajo || !atajo.valor) { btn.classList.remove("activo"); return; }
      var coincide = Eventos.UNIDADES.every(function (u) {
        return (atajo.valor[u.clave] || 0) === (actual[u.clave] || 0);
      });
      btn.classList.toggle("activo", coincide);
    });
  }

  // =========================================================================
  // Modal de evento
  // =========================================================================

  function construirSelectorCategoria() {
    var cont = $("selectorCategoria");
    if (!cont) return;
    limpiar(cont);

    Object.keys(Eventos.CATEGORIAS).forEach(function (clave) {
      var cat = Eventos.CATEGORIAS[clave];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-btn";
      btn.setAttribute("data-cat", clave);

      var punto = document.createElement("span");
      punto.className = "cat-punto";
      punto.style.background = cat.color;
      btn.appendChild(punto);

      var texto = document.createElement("span");
      texto.textContent = cat.nombre;
      btn.appendChild(texto);

      btn.addEventListener("click", function () {
        seleccionarCategoria(clave);
      });

      cont.appendChild(btn);
    });
  }

  function seleccionarCategoria(clave) {
    estado.categoriaSel = clave;
    var botones = document.querySelectorAll(".cat-btn");
    Array.prototype.forEach.call(botones, function (b) {
      var activa = b.getAttribute("data-cat") === clave;
      b.classList.toggle("activa", activa);
      if (activa) {
        var cat = Eventos.CATEGORIAS[clave];
        b.style.borderColor = cat.color;
      } else {
        b.style.borderColor = "";
      }
    });
  }


  function abrirModalEvento(id, fechaPredeterminada) {
    estado.editandoId = id || null;
    var esEdicion = !!id;

    setTexto("modalTitulo", esEdicion ? "Editar evento" : "Nuevo evento");

    var btnBorrar = $("btnBorrarEvento");
    if (btnBorrar) btnBorrar.classList.toggle("hidden", !esEdicion);

    var elTitulo = $("eventoTitulo");
    var elFecha = $("eventoFecha");
    var elFechaFin = $("eventoFechaFin");
    var elHora = $("eventoHora");
    var elHoraFin = $("eventoHoraFin");
    var elTodoElDia = $("eventoTodoElDia");
    var elVariosDias = $("eventoVariosDias");
    var elAnual = $("eventoAnual");
    var elNota = $("eventoNota");
    var elRecordarActivo = $("eventoRecordarActivo");

    if (esEdicion) {
      var ev = Eventos.obtener(id);
      if (!ev) {
        mostrarToast("No se encontró ese evento.");
        return;
      }
      if (elTitulo) elTitulo.value = ev.titulo;
      if (elFecha) elFecha.value = ev.fecha;
      if (elFechaFin) elFechaFin.value = ev.fechaFin || ev.fecha;
      if (elHora) elHora.value = ev.hora || "09:00";
      if (elHoraFin) elHoraFin.value = ev.horaFin || "";
      if (elTodoElDia) elTodoElDia.checked = ev.todoElDia !== false;
      if (elVariosDias) elVariosDias.checked = !!(ev.fechaFin && ev.fechaFin !== ev.fecha);
      if (elAnual) elAnual.checked = ev.anual === true;
      if (elNota) elNota.value = ev.nota || "";

      var r = Eventos.normalizarRecordatorio(ev.recordatorio);
      if (elRecordarActivo) elRecordarActivo.checked = r.activo;
      fijarRuedas(r, false);
      seleccionarCategoria(ev.categoria);
    } else {
      var base = fechaPredeterminada ? claveFecha(fechaPredeterminada) : claveFecha(HOY);
      if (elTitulo) elTitulo.value = "";
      if (elFecha) elFecha.value = base;
      if (elFechaFin) elFechaFin.value = base;
      if (elHora) elHora.value = "09:00";
      if (elHoraFin) elHoraFin.value = "";
      if (elTodoElDia) elTodoElDia.checked = true;
      if (elVariosDias) elVariosDias.checked = false;
      if (elAnual) elAnual.checked = false;
      if (elNota) elNota.value = "";
      if (elRecordarActivo) elRecordarActivo.checked = true;
      fijarRuedas({ meses: 0, semanas: 0, dias: 1, horas: 0, minutos: 0 }, false);
      seleccionarCategoria("personal");
    }

    sincronizarCamposHora();
    sincronizarCamposRango();
    sincronizarBloqueRecordatorio();
    actualizarResumenDuracion();

    mostrar("modalEvento");

    setTimeout(function () {
      refrescarRuedas();
      if (elTitulo && !esEdicion) elTitulo.focus();
    }, 150);
  }

  function sincronizarCamposHora() {
    var todoElDia = ($("eventoTodoElDia") || {}).checked !== false;
    var ci = $("campoHoraInicio");
    var cf = $("campoHoraFin");
    if (ci) ci.classList.toggle("hidden", todoElDia);
    if (cf) {
      var variosDias = ($("eventoVariosDias") || {}).checked === true;
      cf.classList.toggle("hidden", todoElDia || !variosDias);
    }
  }

  function sincronizarCamposRango() {
    var variosDias = ($("eventoVariosDias") || {}).checked === true;
    var cf = $("campoFin");
    if (cf) cf.classList.toggle("hidden", !variosDias);

    if (variosDias) {
      var elFecha = $("eventoFecha");
      var elFechaFin = $("eventoFechaFin");
      if (elFecha && elFechaFin) {
        elFechaFin.setAttribute("min", elFecha.value);
        if (!elFechaFin.value || elFechaFin.value < elFecha.value) {
          elFechaFin.value = elFecha.value;
        }
      }
    }
    sincronizarCamposHora();
  }

  function sincronizarBloqueRecordatorio() {
    var activo = ($("eventoRecordarActivo") || {}).checked === true;
    var bloque = $("bloqueRecordatorio");
    if (bloque) {
      bloque.classList.toggle("hidden", !activo);
      if (activo) setTimeout(refrescarRuedas, 60);
    }
  }

  function actualizarResumenDuracion() {
    var el = $("resumenDuracion");
    if (!el) return;

    var variosDias = ($("eventoVariosDias") || {}).checked === true;
    if (!variosDias) { el.textContent = ""; return; }

    var ini = parseInputDate(($("eventoFecha") || {}).value);
    var fin = parseInputDate(($("eventoFechaFin") || {}).value);
    if (!ini || !fin) { el.textContent = ""; return; }

    if (fin < ini) {
      el.textContent = "La fecha final debe ser posterior a la inicial.";
      return;
    }

    var dias = Math.round((fin - ini) / 86400000) + 1;
    el.textContent = dias === 1
      ? "Un solo día"
      : "Dura " + dias + " días, del " + formatearCorto(ini) + " al " + formatearCorto(fin);
  }

  function cerrarModalEvento() {
    ocultar("modalEvento");
    estado.editandoId = null;
  }

  function guardarEventoDesdeModal() {
    var titulo = (($("eventoTitulo") || {}).value || "").trim();
    var fecha = ($("eventoFecha") || {}).value || "";
    var todoElDia = ($("eventoTodoElDia") || {}).checked !== false;
    var variosDias = ($("eventoVariosDias") || {}).checked === true;
    var fechaFin = variosDias ? (($("eventoFechaFin") || {}).value || fecha) : fecha;
    var hora = todoElDia ? "" : (($("eventoHora") || {}).value || "");
    var horaFin = (todoElDia || !variosDias) ? "" : (($("eventoHoraFin") || {}).value || "");
    var nota = ($("eventoNota") || {}).value || "";
    var anual = ($("eventoAnual") || {}).checked === true;
    var recordarActivo = ($("eventoRecordarActivo") || {}).checked === true;

    if (!titulo) {
      mostrarToast("Ponle un título al evento.");
      var it = $("eventoTitulo");
      if (it) it.focus();
      return;
    }
    if (!Eventos.esFechaValida(fecha)) {
      mostrarToast("Elige una fecha válida.");
      return;
    }
    if (variosDias && fechaFin < fecha) {
      mostrarToast("La fecha final debe ser posterior a la inicial.");
      return;
    }
    if (!todoElDia && !Eventos.esHoraValida(hora)) {
      mostrarToast("Elige una hora válida o marca Todo el día.");
      return;
    }

    var recordatorio = Eventos.recordatorioVacio();
    if (recordarActivo) {
      recordatorio = leerRuedas();
      recordatorio.activo = true;
    }

    var datos = {
      titulo: titulo,
      fecha: fecha,
      fechaFin: fechaFin,
      todoElDia: todoElDia,
      hora: hora,
      horaFin: horaFin,
      nota: nota,
      categoria: estado.categoriaSel,
      recordatorio: recordatorio,
      anual: anual
    };

    if (estado.editandoId) {
      Eventos.actualizar(estado.editandoId, datos);
      mostrarToast("Evento actualizado.");
    } else {
      Eventos.crear(datos);
      mostrarToast("Evento guardado.");
      if (recordarActivo) proponerNotificaciones();
    }

    cerrarModalEvento();
    recargarDatos();
    renderCalendario();
    renderVistaActual();
    revisarRecordatorios();
  }

  function borrarEventoActual() {
    if (!estado.editandoId) return;
    var ev = Eventos.obtener(estado.editandoId);
    var nombre = ev ? ev.titulo : "el evento";
    if (!window.confirm("¿Borrar " + nombre + "? No se puede deshacer.")) return;

    Eventos.borrar(estado.editandoId);
    cerrarModalEvento();
    recargarDatos();
    renderCalendario();
    renderVistaActual();
    mostrarToast("Evento borrado.");
  }

  // =========================================================================
  // Vista 02: Agenda
  // =========================================================================

  function renderAgenda() {
    var cont = $("listaAgenda");
    if (!cont) return;
    limpiar(cont);

    var items = [];

    if (estado.filtroAgenda !== "eventos") {
      // Festivos desde hoy, de este año y el siguiente
      [HOY.getUTCFullYear(), HOY.getUTCFullYear() + 1].forEach(function (a) {
        obtenerFestivos("co", a).forEach(function (f) {
          if (f.fecha >= HOY) items.push({ tipo: "festivo", fecha: f.fecha, dato: f });
        });
      });
    }

    if (estado.filtroAgenda !== "festivos") {
      [HOY.getUTCFullYear(), HOY.getUTCFullYear() + 1].forEach(function (a) {
        Eventos.delAnio(a).forEach(function (e) {
          if (e.fechaObj >= HOY) items.push({ tipo: "evento", fecha: e.fechaObj, dato: e });
        });
      });
    }

    items.sort(function (a, b) { return a.fecha - b.fecha; });
    items = items.slice(0, 40);

    if (items.length === 0) {
      cont.appendChild(mensajeVacio("No hay nada próximo con este filtro."));
      return;
    }

    items.forEach(function (item) {
      if (item.tipo === "festivo") cont.appendChild(crearCardFestivo(item.dato, true));
      else cont.appendChild(crearCardEvento(item.dato));
    });
  }

  function inicializarFiltrosAgenda() {
    var botones = document.querySelectorAll(".filtro[data-agenda]");
    Array.prototype.forEach.call(botones, function (btn) {
      btn.addEventListener("click", function () {
        Array.prototype.forEach.call(botones, function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        estado.filtroAgenda = btn.getAttribute("data-agenda");
        renderAgenda();
      });
    });
  }

  // =========================================================================
  // Vista 03: Mis eventos
  // =========================================================================

  function renderEventos() {
    var cont = $("listaEventos");
    if (!cont) return;
    limpiar(cont);

    var todos = Eventos.cargar();

    if (todos.length === 0) {
      var vacio = document.createElement("div");
      vacio.className = "mensaje-vacio";
      vacio.innerHTML = "";
      var p1 = document.createElement("p");
      p1.textContent = "Todavía no tienes eventos.";
      p1.style.marginBottom = "0.5rem";
      vacio.appendChild(p1);
      var p2 = document.createElement("p");
      p2.textContent = "Añade cumpleaños, pagos, citas o cualquier cosa que quieras recordar.";
      p2.style.fontSize = "0.88rem";
      vacio.appendChild(p2);
      cont.appendChild(vacio);
      return;
    }

    // Mostrar los del año seleccionado, ordenados
    var delAnio = Eventos.delAnio(estado.anio);

    if (delAnio.length === 0) {
      cont.appendChild(mensajeVacio("No tienes eventos en " + estado.anio + ". Cambia de año o añade uno nuevo."));
      return;
    }

    delAnio.forEach(function (e) {
      cont.appendChild(crearCardEvento(e));
    });
  }

  function crearCardEvento(e) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "evento-card";

    var finVigencia = e.fechaFinObj || e.fechaObj;
    if (finVigencia < HOY) card.classList.add("pasado");

    var cat = Eventos.CATEGORIAS[e.categoria] || Eventos.CATEGORIAS.otro;

    var barra = document.createElement("span");
    barra.className = "evento-color";
    barra.style.background = cat.color;
    card.appendChild(barra);

    var bloqueFecha = document.createElement("div");
    bloqueFecha.className = "evento-fecha";
    var dia = document.createElement("span");
    dia.className = "evento-dia";
    dia.textContent = String(e.fechaObj.getUTCDate());
    bloqueFecha.appendChild(dia);
    var mes = document.createElement("span");
    mes.className = "evento-mes";
    mes.textContent = MESES[e.fechaObj.getUTCMonth()].slice(0, 3);
    bloqueFecha.appendChild(mes);
    card.appendChild(bloqueFecha);

    var info = document.createElement("div");
    info.className = "evento-info";

    var titulo = document.createElement("div");
    titulo.className = "evento-titulo";
    titulo.textContent = e.titulo + (e.edad ? " · cumple " + e.edad : "");
    info.appendChild(titulo);

    var meta = document.createElement("div");
    meta.className = "evento-meta";

    if (e.esRango) {
      var tagRango = document.createElement("span");
      tagRango.className = "tag";
      tagRango.textContent = (e.duracionDias + 1) + " días, hasta el " + formatearCorto(e.fechaFinObj);
      meta.appendChild(tagRango);
    } else {
      var diaSem = document.createElement("span");
      diaSem.textContent = DIAS_SEMANA[e.fechaObj.getUTCDay()];
      meta.appendChild(diaSem);
    }

    if (!e.todoElDia && e.hora) {
      var tagHora = document.createElement("span");
      tagHora.className = "tag";
      tagHora.textContent = e.horaFin ? e.hora + " a " + e.horaFin : e.hora;
      meta.appendChild(tagHora);
    }

    var tagCat = document.createElement("span");
    tagCat.className = "tag-categoria";
    tagCat.style.background = cat.color + "22";
    tagCat.style.color = cat.color;
    tagCat.textContent = cat.nombre;
    meta.appendChild(tagCat);

    if (e.anual) {
      var tagAnual = document.createElement("span");
      tagAnual.className = "tag";
      tagAnual.textContent = "cada año";
      meta.appendChild(tagAnual);
    }

    if (e.recordatorio && e.recordatorio.activo) {
      var tagRec = document.createElement("span");
      tagRec.className = "tag puente";
      var texto = Eventos.textoRecordatorio(e.recordatorio);
      tagRec.textContent = texto === "a la hora" ? "aviso a la hora" : "aviso " + texto;
      meta.appendChild(tagRec);
    }

    info.appendChild(meta);

    if (e.nota) {
      var nota = document.createElement("div");
      nota.className = "evento-nota";
      nota.textContent = e.nota;
      info.appendChild(nota);
    }

    card.appendChild(info);

    card.addEventListener("click", function () {
      abrirModalEvento(e.id);
    });

    return card;
  }

  // =========================================================================
  // Cards de festivo
  // =========================================================================

  function mensajeVacio(texto) {
    var p = document.createElement("p");
    p.className = "mensaje-vacio";
    p.textContent = texto;
    return p;
  }

  function crearCardFestivo(f, marcarTipo) {
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

    if (marcarTipo) {
      var tagTipo = document.createElement("span");
      tagTipo.className = "tag";
      tagTipo.textContent = "festivo";
      meta.appendChild(tagTipo);
    }

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
      tagTras.textContent = "movido del " + formatearCorto(f.fechaOriginal);
      meta.appendChild(tagTras);
    }

    info.appendChild(meta);
    card.appendChild(info);
    return card;
  }

  // =========================================================================
  // Vista 04: Puentes
  // =========================================================================

  function renderPuentes() {
    var cont = $("listaPuentes");
    if (!cont) return;
    limpiar(cont);

    var puentes = detectarPuentes(estado.festivos);
    if (puentes.length === 0) {
      cont.appendChild(mensajeVacio("No hay puentes este año."));
      return;
    }
    puentes.forEach(function (f) { cont.appendChild(crearCardFestivo(f)); });
  }

  // =========================================================================
  // Vista 05: Vacaciones
  // =========================================================================

  function renderVacaciones() {
    var cont = $("listaVacaciones");
    if (!cont) return;
    limpiar(cont);

    var sugerencias = sugerirVacaciones(estado.festivos, estado.anio, 4);
    if (sugerencias.length === 0) {
      cont.appendChild(mensajeVacio("No se encontraron ventanas especialmente convenientes este año."));
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
      detalle.textContent = "Pide " + s.diasPedidos + (s.diasPedidos === 1 ? " día" : " días") +
        " y descansas " + s.diasLibres + " días seguidos.";
      card.appendChild(detalle);

      var rango = document.createElement("p");
      rango.className = "vacacion-rango";
      rango.textContent = formatearCorto(s.inicio) + " a " + formatearCorto(s.fin);
      card.appendChild(rango);

      contAppend(card);
    });

    function contAppend(c) { cont.appendChild(c); }
  }

  // =========================================================================
  // Vista 06: Días hábiles
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

      var a1 = inicio.getUTCFullYear();
      var a2 = fin.getUTCFullYear();
      if (a2 - a1 > 20) {
        setTexto("numeroHabiles", "-");
        setTexto("detalleHabiles", "El rango es demasiado amplio. Usa menos de 20 años.");
        return;
      }

      var todos = [];
      for (var a = a1; a <= a2; a++) {
        todos = todos.concat(obtenerFestivos("co", a));
      }

      var habiles = contarDiasHabiles(inicio, fin, todos);
      var totalDias = Math.round((fin - inicio) / 86400000) + 1;
      var enRango = todos.filter(function (f) {
        return f.fecha >= inicio && f.fecha <= fin && !esFinDeSemana(f.fecha);
      });

      setTexto("numeroHabiles", String(habiles));
      setTexto("detalleHabiles",
        totalDias + " días naturales y " + enRango.length +
        (enRango.length === 1 ? " festivo entre semana" : " festivos entre semana"));
    }

    inputInicio.addEventListener("change", calcular);
    inputInicio.addEventListener("input", calcular);
    inputFin.addEventListener("change", calcular);
    inputFin.addEventListener("input", calcular);
    calcular();
  }

  // =========================================================================
  // Vista 07: Comparador
  // =========================================================================

  function renderComparador() {
    var cont = $("comparadorGrid");
    if (!cont) return;
    limpiar(cont);

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
      detalle.textContent = puentes.length + (puentes.length === 1 ? " puente" : " puentes") + " en el año";
      card.appendChild(detalle);

      cont.appendChild(card);
    });
  }

  // =========================================================================
  // Vista 08: Ajustes
  // =========================================================================

  function renderAjustes() {
    actualizarEstadoNotificaciones();

    var todos = Eventos.cargar();
    var total = todos.length;
    var anuales = todos.filter(function (e) { return e.anual; }).length;
    var conAviso = todos.filter(function (e) { return e.recordatorio && e.recordatorio.activo; }).length;
    var rangos = todos.filter(function (e) { return e.fechaFin && e.fechaFin !== e.fecha; }).length;

    var partes = [total + (total === 1 ? " evento guardado" : " eventos guardados")];
    if (anuales) partes.push(anuales + (anuales === 1 ? " se repite cada año" : " se repiten cada año"));
    if (rangos) partes.push(rangos + (rangos === 1 ? " dura varios días" : " duran varios días"));
    if (conAviso) partes.push(conAviso + (conAviso === 1 ? " tiene recordatorio" : " tienen recordatorio"));

    setTexto("statsApp", partes.join(", ") + ".");
  }

  function actualizarEstadoNotificaciones() {
    var permiso = Eventos.permisoNotificaciones();
    var el = $("estadoNotificaciones");
    var btnPermiso = $("btnPermisoAjustes");
    var btnProbar = $("btnProbarNoti");
    if (!el) return;

    limpiar(el);

    if (permiso === "no-soportado") {
      el.textContent = "Este navegador no admite notificaciones.";
      if (btnPermiso) btnPermiso.classList.add("hidden");
      if (btnProbar) btnProbar.classList.add("hidden");
      return;
    }

    if (permiso === "granted") {
      var ok = document.createElement("span");
      ok.className = "estado-ok";
      ok.textContent = "Activadas. ";
      el.appendChild(ok);
      el.appendChild(document.createTextNode(
        "Te avisamos al abrir la aplicación cuando se acerque un evento."));
      if (btnPermiso) btnPermiso.classList.add("hidden");
      if (btnProbar) btnProbar.classList.remove("hidden");
    } else if (permiso === "denied") {
      var no = document.createElement("span");
      no.className = "estado-no";
      no.textContent = "Bloqueadas. ";
      el.appendChild(no);
      el.appendChild(document.createTextNode(
        "Actívalas desde los ajustes del navegador para este sitio."));
      if (btnPermiso) btnPermiso.classList.add("hidden");
      if (btnProbar) btnProbar.classList.add("hidden");
    } else {
      var pend = document.createElement("span");
      pend.className = "estado-pendiente";
      pend.textContent = "Sin activar. ";
      el.appendChild(pend);
      el.appendChild(document.createTextNode(
        "Actívalas para recibir avisos de tus eventos."));
      if (btnPermiso) btnPermiso.classList.remove("hidden");
      if (btnProbar) btnProbar.classList.add("hidden");
    }
  }

  // =========================================================================
  // Recordatorios
  // =========================================================================

  function revisarRecordatorios() {
    var pendientes = Eventos.pendientes(HOY);
    var cont = $("avisosRecordatorio");
    if (!cont) return;

    limpiar(cont);

    if (pendientes.length === 0) {
      cont.classList.add("hidden");
      return;
    }

    cont.classList.remove("hidden");

    pendientes.forEach(function (p) {
      var cat = Eventos.CATEGORIAS[p.evento.categoria] || Eventos.CATEGORIAS.otro;

      var card = document.createElement("div");
      card.className = "aviso-card";
      card.style.borderLeftColor = cat.color;

      var info = document.createElement("div");
      info.className = "aviso-card-info";

      var titulo = document.createElement("div");
      titulo.className = "aviso-card-titulo";
      titulo.textContent = p.evento.titulo;
      info.appendChild(titulo);

      var meta = document.createElement("div");
      meta.className = "aviso-card-meta";
      var detalle = Eventos.textoCuentaAtras(p) + " · " + formatearFechaLarga(p.evento.fechaObj);
      if (!p.evento.todoElDia && p.evento.hora) detalle += " a las " + p.evento.hora;
      if (p.evento.esRango) detalle += " (" + (p.evento.duracionDias + 1) + " días)";
      meta.textContent = detalle;
      info.appendChild(meta);

      card.appendChild(info);

      var cerrar = document.createElement("button");
      cerrar.type = "button";
      cerrar.className = "btn-icono-cerrar";
      cerrar.setAttribute("aria-label", "Descartar aviso");
      cerrar.textContent = "\u00D7";
      cerrar.addEventListener("click", function () {
        Eventos.marcarAvisado(p.claveAviso);
        revisarRecordatorios();
      });
      card.appendChild(cerrar);

      cont.appendChild(card);

      // Notificación del sistema
      if (Eventos.permisoNotificaciones() === "granted") {
        Eventos.notificar(p.evento.titulo, Eventos.textoCuentaAtras(p));
      }
    });

    anunciar(pendientes.length + " recordatorios pendientes");
  }

  function proponerNotificaciones() {
    if (Eventos.permisoNotificaciones() !== "default") return;
    if (leerLS(STORAGE.notisOmitidas) === "si") return;
    mostrar("avisoNotificaciones");
  }

  function activarNotificaciones() {
    Eventos.pedirPermiso().then(function (resultado) {
      ocultar("avisoNotificaciones");
      actualizarEstadoNotificaciones();
      if (resultado === "granted") {
        mostrarToast("Recordatorios activados.");
        revisarRecordatorios();
      } else if (resultado === "denied") {
        mostrarToast("Las notificaciones quedaron bloqueadas en el navegador.", 4000);
      }
    });
  }

  // =========================================================================
  // Búsqueda
  // =========================================================================

  function inicializarBuscador() {
    var input = $("inputBuscar");
    var btnLimpiar = $("btnLimpiarBusqueda");
    if (!input) return;

    var temporizador = null;

    input.addEventListener("input", function () {
      var valor = input.value;
      if (btnLimpiar) btnLimpiar.classList.toggle("hidden", valor.length === 0);

      clearTimeout(temporizador);
      temporizador = setTimeout(function () { ejecutarBusqueda(valor); }, 180);
    });

    if (btnLimpiar) {
      btnLimpiar.addEventListener("click", function () {
        input.value = "";
        btnLimpiar.classList.add("hidden");
        ejecutarBusqueda("");
        input.focus();
      });
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        input.value = "";
        if (btnLimpiar) btnLimpiar.classList.add("hidden");
        ejecutarBusqueda("");
        input.blur();
      }
    });
  }

  function ejecutarBusqueda(termino) {
    var cont = $("resultadosBusqueda");
    var principal = $("contenidoPrincipal");
    if (!cont || !principal) return;

    if (!termino || termino.trim().length < 2) {
      estado.buscando = false;
      cont.classList.add("hidden");
      principal.classList.remove("hidden");
      limpiar(cont);
      return;
    }

    estado.buscando = true;
    principal.classList.add("hidden");
    cont.classList.remove("hidden");
    limpiar(cont);

    // Buscar en varios años
    var festivosBusqueda = [];
    var eventosBusqueda = [];
    var base = HOY.getUTCFullYear();
    for (var a = base - 1; a <= base + 2; a++) {
      festivosBusqueda = festivosBusqueda.concat(obtenerFestivos("co", a));
      eventosBusqueda = eventosBusqueda.concat(Eventos.delAnio(a));
    }

    var resultados = Eventos.buscar(termino, festivosBusqueda, eventosBusqueda);

    var cabecera = document.createElement("p");
    cabecera.className = "resultados-cabecera";
    cabecera.textContent = resultados.length === 0
      ? "Sin resultados para \u201C" + termino + "\u201D"
      : resultados.length + (resultados.length === 1 ? " resultado" : " resultados");
    cont.appendChild(cabecera);

    if (resultados.length === 0) return;

    var lista = document.createElement("div");
    lista.className = "lista-festivos";

    resultados.forEach(function (r) {
      if (r.tipo === "festivo") lista.appendChild(crearCardFestivo(r.dato, true));
      else lista.appendChild(crearCardEvento(r.dato));
    });

    cont.appendChild(lista);
  }

  // =========================================================================
  // Exportación y compartir
  // =========================================================================

  function exportarIcsFestivos() {
    var ics = Eventos.icsDeFestivos(estado.festivos, estado.anio);
    var ok = Eventos.descargar(ics, "festivos-colombia-" + estado.anio + ".ics", "text/calendar");
    mostrarToast(ok ? "Archivo descargado. Ábrelo para añadirlo a tu calendario." : "No se pudo descargar.", 4000);
  }

  function exportarIcsEventos() {
    var eventos = Eventos.cargar();
    if (eventos.length === 0) {
      mostrarToast("Todavía no tienes eventos para exportar.");
      return;
    }
    var proyectados = Eventos.delAnio(estado.anio);
    if (proyectados.length === 0) {
      mostrarToast("No tienes eventos en " + estado.anio + ".");
      return;
    }
    var ics = Eventos.icsDeEventos(proyectados);
    var ok = Eventos.descargar(ics, "mis-eventos-" + estado.anio + ".ics", "text/calendar");
    mostrarToast(ok ? "Archivo descargado. Ábrelo para añadirlo a tu calendario." : "No se pudo descargar.", 4000);
  }

  function exportarIcsTodo() {
    var eventos = Eventos.delAnio(estado.anio);
    if (estado.festivos.length === 0 && eventos.length === 0) {
      mostrarToast("No hay nada que exportar.");
      return;
    }
    var ics = Eventos.icsMixto(estado.festivos, eventos, estado.anio);
    var ok = Eventos.descargar(ics, "calendario-" + estado.anio + ".ics", "text/calendar");
    mostrarToast(ok ? "Archivo descargado con festivos y eventos." : "No se pudo descargar.", 4000);
  }

  function compartirAnio() {
    var puentes = detectarPuentes(estado.festivos);
    var texto = "En " + estado.anio + " Colombia tiene " + estado.festivos.length +
      " festivos y " + puentes.length + " puentes.";

    var proximos = estado.festivos.filter(function (f) { return f.fecha >= HOY; }).slice(0, 3);
    if (proximos.length) {
      texto += " Los próximos: " + proximos.map(function (f) {
        return f.nombre + " (" + formatearCorto(f.fecha) + ")";
      }).join(", ") + ".";
    }

    Eventos.compartir({
      title: "Festivos " + estado.anio,
      text: texto,
      url: window.location.href
    }).then(function (r) {
      if (r.via === "portapapeles") mostrarToast("Copiado al portapapeles.");
      else if (r.via === "cancelado") { /* silencio */ }
      else if (!r.ok) mostrarToast("No se pudo compartir.");
    });
  }

  // =========================================================================
  // Copia de seguridad
  // =========================================================================

  function descargarCopia() {
    var eventos = Eventos.cargar();
    if (eventos.length === 0) {
      mostrarToast("No tienes eventos que respaldar.");
      return;
    }
    var json = Eventos.exportarDatos();
    var fecha = claveFecha(HOY);
    var ok = Eventos.descargar(json, "festivos-copia-" + fecha + ".json", "application/json");
    mostrarToast(ok ? "Copia descargada." : "No se pudo descargar.");
  }

  function inicializarImportacion() {
    var input = $("inputImportar");
    if (!input) return;

    onClick("btnImportarCopia", function () { input.click(); });

    input.addEventListener("change", function () {
      var archivo = input.files && input.files[0];
      if (!archivo) return;

      var lector = new FileReader();
      lector.onload = function () {
        var fusionar = window.confirm(
          "¿Quieres añadir estos eventos a los que ya tienes?\n\n" +
          "Aceptar: añadir sin borrar nada.\n" +
          "Cancelar: reemplazar todos tus eventos actuales."
        );

        var resultado = Eventos.importarDatos(String(lector.result), fusionar ? "fusionar" : "reemplazar");

        if (!resultado.ok) {
          mostrarToast(resultado.error, 4000);
        } else {
          mostrarToast(
            resultado.modo === "fusionar"
              ? "Se añadieron " + resultado.cantidad + " eventos."
              : "Se restauraron " + resultado.cantidad + " eventos.",
            3500
          );
          recargarDatos();
          renderCalendario();
          renderVistaActual();
          revisarRecordatorios();
        }
        input.value = "";
      };
      lector.onerror = function () {
        mostrarToast("No se pudo leer el archivo.");
        input.value = "";
      };
      lector.readAsText(archivo);
    });
  }

  function borrarTodosLosEventos() {
    var total = Eventos.cargar().length;
    if (total === 0) {
      mostrarToast("No tienes eventos guardados.");
      return;
    }
    if (!window.confirm("¿Borrar tus " + total + " eventos? Esto no se puede deshacer.")) return;
    if (!window.confirm("Confirma otra vez: se borrarán todos tus eventos de este dispositivo.")) return;

    Eventos.cargar().forEach(function (e) { Eventos.borrar(e.id); });
    recargarDatos();
    renderCalendario();
    renderVistaActual();
    revisarRecordatorios();
    mostrarToast("Se borraron todos tus eventos.");
  }

  // =========================================================================
  // Navegación
  // =========================================================================

  var MAPA_VISTAS = {
    calendario: "vistaCalendario",
    agenda: "vistaAgenda",
    eventos: "vistaEventos",
    puentes: "vistaPuentes",
    vacaciones: "vistaVacaciones",
    habiles: "vistaHabiles",
    comparador: "vistaComparador",
    ajustes: "vistaAjustes"
  };

  function cambiarVista(vista) {
    if (!MAPA_VISTAS[vista]) return;

    // Salir de la búsqueda si estaba activa
    var input = $("inputBuscar");
    if (estado.buscando && input) {
      input.value = "";
      ocultar("btnLimpiarBusqueda");
      ejecutarBusqueda("");
    }

    var items = document.querySelectorAll(".nav-item[data-view]");
    Array.prototype.forEach.call(items, function (b) {
      var activo = b.getAttribute("data-view") === vista;
      b.classList.toggle("active", activo);
      b.setAttribute("aria-selected", activo ? "true" : "false");
    });

    estado.vistaActiva = vista;

    var vistas = document.querySelectorAll(".vista");
    Array.prototype.forEach.call(vistas, function (v) { v.classList.add("hidden"); });

    var target = $(MAPA_VISTAS[vista]);
    if (target) target.classList.remove("hidden");

    renderVistaActual();

    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }

  function renderVistaActual() {
    var v = estado.vistaActiva;
    if (v === "agenda") renderAgenda();
    else if (v === "eventos") renderEventos();
    else if (v === "puentes") renderPuentes();
    else if (v === "vacaciones") renderVacaciones();
    else if (v === "comparador") renderComparador();
    else if (v === "ajustes") renderAjustes();
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
  // Dropdown de año
  // =========================================================================

  function construirDropdownAnio() {
    var menu = document.querySelector("#dropdownAnio .dropdown-menu");
    if (!menu) return;
    limpiar(menu);
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
      Array.prototype.forEach.call(items, function (item) { item.classList.remove("selected"); });
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
  // PWA
  // =========================================================================

  var promptInstalacion = null;

  function esStandalone() {
    try {
      return window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
    } catch (e) {
      return false;
    }
  }

  function esIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function mostrarBannerInstalacion() {
    if (leerLS(STORAGE.installCerrado) === "si") return;
    if (esStandalone()) return;
    mostrar("installBanner");
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
      mostrar("linkInstall");
    });

    window.addEventListener("appinstalled", function () {
      promptInstalacion = null;
      ocultar("installBanner");
      ocultar("linkInstall");
      mostrarToast("Instalada. Ya puedes abrirla desde tu pantalla de inicio.");
    });

    if (esIOS() && !esStandalone()) {
      setTexto("installTitulo", "Añadir a la pantalla de inicio");
      setTexto("installDesc", "Toca el botón Compartir y luego Añadir a inicio.");
      var btn = $("btnInstalar");
      if (btn) btn.textContent = "Cómo hacerlo";
      mostrarBannerInstalacion();
    }

    onClick("btnInstalar", instalarApp);
    onClick("linkInstall", function (e) {
      e.preventDefault();
      instalarApp();
    });
    onClick("btnCerrarInstall", function () {
      ocultar("installBanner");
      guardarLS(STORAGE.installCerrado, "si");
    });
  }

  function instalarApp() {
    if (esIOS()) {
      mostrarToast("En iPhone: toca Compartir y luego Añadir a pantalla de inicio.", 5000);
      return;
    }
    if (!promptInstalacion) {
      mostrarToast("Usa el menú del navegador y elige Instalar aplicación.", 4500);
      return;
    }
    promptInstalacion.prompt();
    promptInstalacion.userChoice.then(function (r) {
      if (r && r.outcome === "accepted") ocultar("installBanner");
      promptInstalacion = null;
    }).catch(function () { promptInstalacion = null; });
  }

  // =========================================================================
  // Init
  // =========================================================================

  function init() {
    try {
      setTexto("anioActual", String(HOY.getUTCFullYear()));
      aplicarTema();
      setTexto("hoyTexto", formatearFechaLarga(HOY));

      recargarDatos();
      actualizarProximoFestivo();

      construirDropdownAnio();
      sincronizarDropdownAnio();
      construirSelectorCategoria();
      construirRuedas();
      construirAtajos();
      seleccionarCategoria("personal");

      renderCalendario();

      inicializarNav();
      inicializarFiltrosAgenda();
      inicializarCalculadora();
      inicializarBuscador();
      inicializarImportacion();

      configurarDropdown("dropdownAnio", function (valor) {
        estado.anio = parseInt(valor, 10);
        guardarLS(STORAGE.anio, estado.anio);
        recargarDatos();
        renderCalendario();
        renderVistaActual();
        anunciar("Año cambiado a " + estado.anio);
      });

      onClick("btnTema", function () {
        estado.tema = estado.tema === "claro" ? "oscuro" : "claro";
        guardarLS(STORAGE.tema, estado.tema);
        aplicarTema();
      });

      onClick("btnIrHoy", irAHoy);
      onClick("btnExportarAnio", exportarIcsFestivos);
      onClick("btnCompartirAnio", compartirAnio);

      // Eventos
      onClick("btnNuevoEvento", function () { abrirModalEvento(null); });
      onClick("btnNuevoEventoTop", function () { abrirModalEvento(null); });
      onClick("btnExportarEventos", exportarIcsEventos);
      onClick("btnGuardarEvento", guardarEventoDesdeModal);
      onClick("btnCancelarEvento", cerrarModalEvento);
      onClick("btnCerrarModal", cerrarModalEvento);
      onClick("btnBorrarEvento", borrarEventoActual);

      // Controles del modal de evento
      var chkTodoElDia = $("eventoTodoElDia");
      if (chkTodoElDia) chkTodoElDia.addEventListener("change", sincronizarCamposHora);

      var chkVariosDias = $("eventoVariosDias");
      if (chkVariosDias) chkVariosDias.addEventListener("change", function () {
        sincronizarCamposRango();
        actualizarResumenDuracion();
      });

      var chkRecordar = $("eventoRecordarActivo");
      if (chkRecordar) chkRecordar.addEventListener("change", sincronizarBloqueRecordatorio);

      var inFecha = $("eventoFecha");
      if (inFecha) inFecha.addEventListener("change", function () {
        sincronizarCamposRango();
        actualizarResumenDuracion();
      });

      var inFechaFin = $("eventoFechaFin");
      if (inFechaFin) inFechaFin.addEventListener("change", actualizarResumenDuracion);

      onClick("btnCerrarModalDia", cerrarModalDia);
      onClick("btnAnadirEnDia", function () {
        var fecha = estado.fechaModalDia;
        cerrarModalDia();
        abrirModalEvento(null, fecha);
      });

      // Notificaciones
      onClick("btnActivarNotis", activarNotificaciones);
      onClick("btnOmitirNotis", function () {
        ocultar("avisoNotificaciones");
        guardarLS(STORAGE.notisOmitidas, "si");
      });
      onClick("btnPermisoAjustes", activarNotificaciones);
      onClick("btnProbarNoti", function () {
        var ok = Eventos.notificar("Festivos", "Así se verán tus recordatorios.");
        mostrarToast(ok ? "Notificación enviada." : "No se pudo enviar la notificación.");
      });

      // Ajustes
      onClick("btnExportarCopia", descargarCopia);
      onClick("btnIcsFestivos", exportarIcsFestivos);
      onClick("btnIcsEventos", exportarIcsEventos);
      onClick("btnIcsTodo", exportarIcsTodo);
      onClick("btnBorrarTodo", borrarTodosLosEventos);

      // Cerrar modales al tocar el fondo
      ["modalEvento", "modalDia"].forEach(function (idModal) {
        var m = $(idModal);
        if (!m) return;
        m.addEventListener("click", function (e) {
          if (e.target === m) {
            if (idModal === "modalEvento") cerrarModalEvento();
            else cerrarModalDia();
          }
        });
      });

      // Escape cierra modales y dropdowns
      document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        var me = $("modalEvento");
        var md = $("modalDia");
        if (me && !me.classList.contains("hidden")) cerrarModalEvento();
        else if (md && !md.classList.contains("hidden")) cerrarModalDia();
      });

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
      revisarRecordatorios();

      if (Eventos.cargar().length > 0) proponerNotificaciones();

      setTimeout(desplazarAlMesActual, 450);

      console.log("%cFestivos", "font-size: 26px; font-weight: bold; color: #3B82F6;");
      console.log("%chttps://github.com/siestaa42002-code/festivos-colombia-2026", "font-size: 12px; color: #999;");
    } catch (err) {
      console.error("Error al iniciar Festivos:", err);
      mostrarToast("Hubo un error al cargar. Recarga la página.", 5000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
