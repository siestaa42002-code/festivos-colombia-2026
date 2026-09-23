/*
  Festivos · Módulo de eventos personales
  Autor: siestaa42002-code
  https://github.com/siestaa42002-code/festivos-colombia-2026
  Licencia: MIT
*/

(function (global) {
  "use strict";

  var CLAVE_EVENTOS = "festivos:eventos";
  var CLAVE_AVISADOS = "festivos:avisados";
  var CLAVE_PERMISO = "festivos:permisoPedido";

  var OFFSET_BOGOTA_MIN = -300; // UTC-5

  // =========================================================================
  // Categorías
  // =========================================================================

  var CATEGORIAS = {
    cumpleanos: { nombre: "Cumpleaños", color: "#EC4899" },
    personal:   { nombre: "Personal",   color: "#8B5CF6" },
    trabajo:    { nombre: "Trabajo",    color: "#F59E0B" },
    salud:      { nombre: "Salud",      color: "#10B981" },
    viaje:      { nombre: "Viaje",      color: "#06B6D4" },
    pago:       { nombre: "Pago",       color: "#EF4444" },
    otro:       { nombre: "Otro",       color: "#64748B" }
  };

  // Unidades del selector de recordatorio, con sus topes
  var UNIDADES = [
    { clave: "meses",   etiqueta: "meses",   max: 12, paso: 1, minutos: 30 * 24 * 60 },
    { clave: "semanas", etiqueta: "semanas", max: 4,  paso: 1, minutos: 7 * 24 * 60 },
    { clave: "dias",    etiqueta: "días",    max: 30, paso: 1, minutos: 24 * 60 },
    { clave: "horas",   etiqueta: "horas",   max: 23, paso: 1, minutos: 60 },
    { clave: "minutos", etiqueta: "minutos", max: 55, paso: 5, minutos: 1 }
  ];

  // Atajos rápidos de recordatorio
  var ATAJOS = [
    { texto: "Sin aviso",     valor: null },
    { texto: "A la hora",     valor: { meses: 0, semanas: 0, dias: 0, horas: 0, minutos: 0 } },
    { texto: "15 min antes",  valor: { meses: 0, semanas: 0, dias: 0, horas: 0, minutos: 15 } },
    { texto: "1 hora antes",  valor: { meses: 0, semanas: 0, dias: 0, horas: 1, minutos: 0 } },
    { texto: "1 día antes",   valor: { meses: 0, semanas: 0, dias: 1, horas: 0, minutos: 0 } },
    { texto: "1 semana antes",valor: { meses: 0, semanas: 1, dias: 0, horas: 0, minutos: 0 } }
  ];

  function recordatorioVacio() {
    return { activo: false, meses: 0, semanas: 0, dias: 0, horas: 0, minutos: 0 };
  }

  function normalizarRecordatorio(r) {
    var base = recordatorioVacio();
    if (!r || typeof r !== "object") return base;
    base.activo = r.activo === true;
    UNIDADES.forEach(function (u) {
      var v = Number(r[u.clave]);
      base[u.clave] = isFinite(v) && v > 0 ? Math.min(Math.floor(v), u.max) : 0;
    });
    return base;
  }

  function recordatorioEnMinutos(r) {
    var total = 0;
    UNIDADES.forEach(function (u) {
      total += (r[u.clave] || 0) * u.minutos;
    });
    return total;
  }

  function textoRecordatorioCorto(r) {
    if (!r || !r.activo) return "";
    var total = recordatorioEnMinutos(r);
    if (total === 0) return "a la hora";

    var partes = [];
    UNIDADES.forEach(function (u) {
      var v = r[u.clave];
      if (!v) return;
      var etiqueta = u.etiqueta;
      if (v === 1) {
        if (u.clave === "meses") etiqueta = "mes";
        else if (u.clave === "semanas") etiqueta = "semana";
        else if (u.clave === "dias") etiqueta = "día";
        else if (u.clave === "horas") etiqueta = "hora";
        else if (u.clave === "minutos") etiqueta = "minuto";
      }
      partes.push(v + " " + etiqueta);
    });

    if (partes.length === 0) return "a la hora";
    if (partes.length === 1) return partes[0] + " antes";
    var ultima = partes.pop();
    return partes.join(", ") + " y " + ultima + " antes";
  }

  // =========================================================================
  // Almacenamiento
  // =========================================================================

  function leerLS(clave, porDefecto) {
    try {
      var v = localStorage.getItem(clave);
      return v === null ? porDefecto : JSON.parse(v);
    } catch (e) {
      return porDefecto;
    }
  }

  function guardarLS(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      return false;
    }
  }

  function nuevoId() {
    return "ev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  /*
    Migra eventos del formato antiguo (recordar: número de días) al nuevo
    (recordatorio: objeto con unidades). Se ejecuta al cargar.
  */
  function migrar(evento) {
    if (evento.recordatorio) {
      evento.recordatorio = normalizarRecordatorio(evento.recordatorio);
    } else if (typeof evento.recordar === "number") {
      var r = recordatorioVacio();
      if (evento.recordar >= 0) {
        r.activo = true;
        r.dias = Math.min(evento.recordar, 30);
      }
      evento.recordatorio = r;
      delete evento.recordar;
    } else {
      evento.recordatorio = recordatorioVacio();
    }

    if (!evento.fechaFin) evento.fechaFin = evento.fecha;
    if (evento.todoElDia === undefined) evento.todoElDia = !evento.hora;
    if (!evento.hora) evento.hora = "";
    if (!evento.horaFin) evento.horaFin = "";

    return evento;
  }

  function cargarEventos() {
    var arr = leerLS(CLAVE_EVENTOS, []);
    if (!Array.isArray(arr)) return [];
    return arr.map(migrar);
  }

  function guardarEventos(eventos) {
    return guardarLS(CLAVE_EVENTOS, eventos);
  }

  // =========================================================================
  // Fechas y horas
  // =========================================================================

  function esFechaValida(s) {
    return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  }

  function esHoraValida(s) {
    return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
  }

  /*
    Convierte una fecha y hora de Bogotá al instante real (timestamp UTC).
    Bogotá es UTC-5 todo el año, sin horario de verano.
  */
  function instanteBogota(fechaStr, horaStr) {
    var f = fechaStr.split("-").map(Number);
    var h = esHoraValida(horaStr) ? horaStr.split(":").map(Number) : [0, 0];
    return Date.UTC(f[0], f[1] - 1, f[2], h[0], h[1]) - OFFSET_BOGOTA_MIN * 60000;
  }

  function ahoraEnBogota() {
    return Date.now();
  }

  // =========================================================================
  // CRUD
  // =========================================================================

  function crearEvento(datos) {
    var eventos = cargarEventos();

    var fecha = esFechaValida(datos.fecha) ? datos.fecha : null;
    if (!fecha) return null;

    var fechaFin = esFechaValida(datos.fechaFin) ? datos.fechaFin : fecha;
    if (fechaFin < fecha) fechaFin = fecha;

    var todoElDia = datos.todoElDia !== false;

    var evento = {
      id: nuevoId(),
      titulo: String(datos.titulo || "").trim().slice(0, 80),
      fecha: fecha,
      fechaFin: fechaFin,
      todoElDia: todoElDia,
      hora: !todoElDia && esHoraValida(datos.hora) ? datos.hora : "",
      horaFin: !todoElDia && esHoraValida(datos.horaFin) ? datos.horaFin : "",
      nota: String(datos.nota || "").trim().slice(0, 300),
      categoria: CATEGORIAS[datos.categoria] ? datos.categoria : "personal",
      recordatorio: normalizarRecordatorio(datos.recordatorio),
      anual: datos.anual === true,
      creado: Date.now()
    };

    eventos.push(evento);
    guardarEventos(eventos);
    return evento;
  }

  function actualizarEvento(id, datos) {
    var eventos = cargarEventos();
    var i = -1;
    for (var k = 0; k < eventos.length; k++) {
      if (eventos[k].id === id) { i = k; break; }
    }
    if (i === -1) return null;

    var e = eventos[i];

    if (datos.titulo !== undefined) e.titulo = String(datos.titulo).trim().slice(0, 80);
    if (datos.fecha !== undefined && esFechaValida(datos.fecha)) e.fecha = datos.fecha;
    if (datos.fechaFin !== undefined) {
      e.fechaFin = esFechaValida(datos.fechaFin) && datos.fechaFin >= e.fecha ? datos.fechaFin : e.fecha;
    }
    if (datos.todoElDia !== undefined) e.todoElDia = datos.todoElDia !== false;
    if (datos.hora !== undefined) e.hora = !e.todoElDia && esHoraValida(datos.hora) ? datos.hora : "";
    if (datos.horaFin !== undefined) e.horaFin = !e.todoElDia && esHoraValida(datos.horaFin) ? datos.horaFin : "";
    if (datos.nota !== undefined) e.nota = String(datos.nota).trim().slice(0, 300);
    if (datos.categoria !== undefined && CATEGORIAS[datos.categoria]) e.categoria = datos.categoria;
    if (datos.recordatorio !== undefined) e.recordatorio = normalizarRecordatorio(datos.recordatorio);
    if (datos.anual !== undefined) e.anual = datos.anual === true;

    if (e.fechaFin < e.fecha) e.fechaFin = e.fecha;

    guardarEventos(eventos);
    return e;
  }

  function borrarEvento(id) {
    var eventos = cargarEventos().filter(function (e) { return e.id !== id; });
    guardarEventos(eventos);

    var avisados = leerLS(CLAVE_AVISADOS, {});
    Object.keys(avisados).forEach(function (k) {
      if (k.indexOf(id) === 0) delete avisados[k];
    });
    guardarLS(CLAVE_AVISADOS, avisados);
  }

  function obtenerEvento(id) {
    var eventos = cargarEventos();
    for (var i = 0; i < eventos.length; i++) {
      if (eventos[i].id === id) return eventos[i];
    }
    return null;
  }

  // =========================================================================
  // Proyección por año
  // =========================================================================

  function ajustarDiaDelMes(anio, mes, dia) {
    var ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    return Math.min(dia, ultimo);
  }

  function eventosDelAnio(anio) {
    var resultado = [];

    cargarEventos().forEach(function (e) {
      if (!esFechaValida(e.fecha)) return;

      var p = e.fecha.split("-").map(Number);
      var anioOriginal = p[0], mes = p[1], dia = p[2];

      if (e.anual) {
        resultado.push(proyectar(e, anio, mes, ajustarDiaDelMes(anio, mes, dia), anioOriginal));
      } else if (anioOriginal === anio) {
        resultado.push(proyectar(e, anio, mes, dia, anioOriginal));
      }
    });

    resultado.sort(function (a, b) {
      var d = a.fechaObj - b.fechaObj;
      if (d !== 0) return d;
      return (a.hora || "").localeCompare(b.hora || "");
    });
    return resultado;
  }

  function proyectar(evento, anio, mes, dia, anioOriginal) {
    var copia = {};
    Object.keys(evento).forEach(function (k) { copia[k] = evento[k]; });

    copia.fechaObj = global.crearFecha(anio, mes, dia);
    copia.anioOriginal = anioOriginal;
    copia.edad = evento.anual && anioOriginal < anio ? anio - anioOriginal : null;

    // Proyectar el fin conservando la duración en días
    var duracion = 0;
    if (esFechaValida(evento.fechaFin) && evento.fechaFin !== evento.fecha) {
      var ini = global.crearFecha.apply(null, evento.fecha.split("-").map(Number));
      var fin = global.crearFecha.apply(null, evento.fechaFin.split("-").map(Number));
      duracion = Math.round((fin - ini) / 86400000);
    }
    copia.duracionDias = duracion;
    copia.fechaFinObj = duracion > 0 ? global.sumarDias(copia.fechaObj, duracion) : copia.fechaObj;
    copia.esRango = duracion > 0;

    copia.instante = instanteBogota(global.claveFecha(copia.fechaObj), evento.hora);

    return copia;
  }

  /*
    Devuelve todas las fechas que abarca un evento proyectado.
    Para eventos de un solo día devuelve una sola fecha.
  */
  function diasDelEvento(eventoProyectado) {
    var dias = [];
    var cursor = eventoProyectado.fechaObj;
    var total = (eventoProyectado.duracionDias || 0) + 1;
    if (total > 400) total = 400;
    for (var i = 0; i < total; i++) {
      dias.push(cursor);
      cursor = global.sumarDias(cursor, 1);
    }
    return dias;
  }

  function textoRango(e) {
    var partes = [];
    if (e.esRango) {
      partes.push("del " + e.fechaObj.getUTCDate() + " " + global.MESES[e.fechaObj.getUTCMonth()].slice(0, 3) +
        " al " + e.fechaFinObj.getUTCDate() + " " + global.MESES[e.fechaFinObj.getUTCMonth()].slice(0, 3));
      partes.push((e.duracionDias + 1) + " días");
    }
    if (!e.todoElDia && e.hora) {
      partes.push(e.horaFin ? e.hora + " a " + e.horaFin : e.hora);
    }
    return partes.join(" · ");
  }

  // =========================================================================
  // Recordatorios
  // =========================================================================

  function soportaNotificaciones() {
    return typeof Notification !== "undefined";
  }

  function permisoNotificaciones() {
    if (!soportaNotificaciones()) return "no-soportado";
    return Notification.permission;
  }

  function pedirPermisoNotificaciones() {
    if (!soportaNotificaciones()) return Promise.resolve("no-soportado");
    guardarLS(CLAVE_PERMISO, true);
    try {
      var r = Notification.requestPermission();
      if (r && typeof r.then === "function") return r;
      return Promise.resolve(Notification.permission);
    } catch (e) {
      return Promise.resolve(Notification.permission);
    }
  }

  /*
    Recordatorios que ya deberían haberse disparado y aún no se avisaron.
    Trabaja con precisión de minutos.
  */
  function recordatoriosPendientes(ahora) {
    var ahoraMs = typeof ahora === "number" ? ahora : ahoraEnBogota();
    var pendientes = [];
    var avisados = leerLS(CLAVE_AVISADOS, {});
    var anioActual = new Date(ahoraMs).getUTCFullYear();

    [anioActual, anioActual + 1].forEach(function (anio) {
      eventosDelAnio(anio).forEach(function (e) {
        var r = e.recordatorio;
        if (!r || !r.activo) return;

        var minutosAntes = recordatorioEnMinutos(r);
        var instanteAviso = e.instante - minutosAntes * 60000;
        var clave = e.id + "|" + global.claveFecha(e.fechaObj);

        // Margen: el evento sigue vigente hasta el final del último día
        var finVigencia = instanteBogota(global.claveFecha(e.fechaFinObj), "23:59");
        if (ahoraMs > finVigencia) return;
        if (ahoraMs < instanteAviso) return;
        if (avisados[clave]) return;

        pendientes.push({
          evento: e,
          faltanMs: e.instante - ahoraMs,
          claveAviso: clave
        });
      });
    });

    pendientes.sort(function (a, b) { return a.faltanMs - b.faltanMs; });
    return pendientes;
  }

  function marcarAvisado(claveAviso) {
    var avisados = leerLS(CLAVE_AVISADOS, {});
    avisados[claveAviso] = Date.now();
    guardarLS(CLAVE_AVISADOS, avisados);
  }

  function textoCuentaAtras(pendiente) {
    var ms = pendiente.faltanMs;
    if (ms <= 0) {
      var e = pendiente.evento;
      if (e.esRango && ms > -((e.duracionDias + 1) * 86400000)) return "En curso";
      return e.todoElDia ? "Es hoy" : "Está ocurriendo";
    }

    var minutos = Math.floor(ms / 60000);
    if (minutos < 1) return "En menos de un minuto";
    if (minutos < 60) return "En " + minutos + (minutos === 1 ? " minuto" : " minutos");

    var horas = Math.floor(minutos / 60);
    if (horas < 24) {
      var minRestantes = minutos % 60;
      if (minRestantes === 0) return "En " + horas + (horas === 1 ? " hora" : " horas");
      return "En " + horas + " h " + minRestantes + " min";
    }

    var dias = Math.floor(horas / 24);
    if (dias === 1) return "Mañana";
    if (dias < 30) return "En " + dias + " días";

    var meses = Math.round(dias / 30);
    return "En " + meses + (meses === 1 ? " mes" : " meses");
  }

  function lanzarNotificacion(titulo, cuerpo) {
    if (!soportaNotificaciones()) return false;
    if (Notification.permission !== "granted") return false;
    try {
      var n = new Notification(titulo, {
        body: cuerpo,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "festivos-" + titulo
      });
      n.onclick = function () {
        try { window.focus(); } catch (e) {}
        n.close();
      };
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // Exportar a calendario (.ics)
  // =========================================================================

  function escaparICS(texto) {
    return String(texto || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function fechaICS(fecha) {
    var y = fecha.getUTCFullYear();
    var m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
    var d = String(fecha.getUTCDate()).padStart(2, "0");
    return String(y) + m + d;
  }

  function instanteICS(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() +
      String(d.getUTCMonth() + 1).padStart(2, "0") +
      String(d.getUTCDate()).padStart(2, "0") + "T" +
      String(d.getUTCHours()).padStart(2, "0") +
      String(d.getUTCMinutes()).padStart(2, "0") +
      String(d.getUTCSeconds()).padStart(2, "0") + "Z";
  }

  function selloICS() {
    return instanteICS(Date.now());
  }

  function plegarLinea(linea) {
    if (linea.length <= 74) return linea;
    var partes = [linea.slice(0, 74)];
    var resto = linea.slice(74);
    while (resto.length > 73) {
      partes.push(" " + resto.slice(0, 73));
      resto = resto.slice(73);
    }
    if (resto.length) partes.push(" " + resto);
    return partes.join("\r\n");
  }

  function duracionISO(minutos) {
    if (minutos === 0) return "PT0M";
    var partes = "P";
    var dias = Math.floor(minutos / (24 * 60));
    var resto = minutos % (24 * 60);
    var horas = Math.floor(resto / 60);
    var mins = resto % 60;
    if (dias) partes += dias + "D";
    if (horas || mins) {
      partes += "T";
      if (horas) partes += horas + "H";
      if (mins) partes += mins + "M";
    }
    return partes;
  }

  function construirICS(entradas, nombreCalendario) {
    var lineas = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//siestaa42002-code//Festivos//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:" + escaparICS(nombreCalendario || "Festivos"),
      "X-WR-TIMEZONE:America/Bogota"
    ];

    var sello = selloICS();

    entradas.forEach(function (en, i) {
      lineas.push("BEGIN:VEVENT");
      lineas.push("UID:" + (en.uid || ("festivos-" + i + "-" + Date.now() + "@siestaa42002-code")));
      lineas.push("DTSTAMP:" + sello);

      if (en.conHora && typeof en.instanteInicio === "number") {
        lineas.push("DTSTART:" + instanteICS(en.instanteInicio));
        var finMs = typeof en.instanteFin === "number" && en.instanteFin > en.instanteInicio
          ? en.instanteFin
          : en.instanteInicio + 3600000;
        lineas.push("DTEND:" + instanteICS(finMs));
      } else {
        lineas.push("DTSTART;VALUE=DATE:" + fechaICS(en.fecha));
        var finFecha = en.fechaFin && en.fechaFin > en.fecha ? en.fechaFin : en.fecha;
        lineas.push("DTEND;VALUE=DATE:" + fechaICS(global.sumarDias(finFecha, 1)));
      }

      lineas.push(plegarLinea("SUMMARY:" + escaparICS(en.titulo)));
      if (en.descripcion) lineas.push(plegarLinea("DESCRIPTION:" + escaparICS(en.descripcion)));
      if (en.anual) lineas.push("RRULE:FREQ=YEARLY");
      lineas.push("TRANSP:TRANSPARENT");

      if (en.recordatorio && en.recordatorio.activo) {
        var mins = recordatorioEnMinutos(en.recordatorio);
        lineas.push("BEGIN:VALARM");
        lineas.push("ACTION:DISPLAY");
        lineas.push(plegarLinea("DESCRIPTION:" + escaparICS(en.titulo)));
        lineas.push("TRIGGER:" + (mins === 0 ? "PT0M" : "-" + duracionISO(mins)));
        lineas.push("END:VALARM");
      }

      lineas.push("END:VEVENT");
    });

    lineas.push("END:VCALENDAR");
    return lineas.join("\r\n");
  }

  function icsDeFestivos(festivos, anio) {
    var entradas = festivos.map(function (f, i) {
      var desc = "Festivo nacional de Colombia.";
      if (f.trasladado && f.fechaOriginal) {
        desc += " Trasladado desde el " + f.fechaOriginal.getUTCDate() +
          " de " + global.MESES[f.fechaOriginal.getUTCMonth()] + " por la Ley Emiliani.";
      }
      return {
        uid: "festivo-" + anio + "-" + i + "@siestaa42002-code",
        fecha: f.fecha,
        titulo: f.nombre,
        descripcion: desc
      };
    });
    return construirICS(entradas, "Festivos Colombia " + anio);
  }

  function entradaDesdeEvento(e) {
    var conHora = !e.todoElDia && !!e.hora;
    var instanteFin = null;

    if (conHora) {
      var fechaFinStr = global.claveFecha(e.fechaFinObj || e.fechaObj);
      if (e.horaFin) instanteFin = instanteBogota(fechaFinStr, e.horaFin);
      else if (e.esRango) instanteFin = instanteBogota(fechaFinStr, e.hora) + 3600000;
    }

    return {
      uid: e.id + "-" + global.claveFecha(e.fechaObj) + "@siestaa42002-code",
      fecha: e.fechaObj,
      fechaFin: e.fechaFinObj || e.fechaObj,
      conHora: conHora,
      instanteInicio: conHora ? e.instante : null,
      instanteFin: instanteFin,
      titulo: e.titulo,
      descripcion: e.nota,
      anual: e.anual,
      recordatorio: e.recordatorio
    };
  }

  function icsDeEventos(eventos) {
    return construirICS(eventos.map(entradaDesdeEvento), "Mis eventos");
  }

  function icsMixto(festivos, eventos, anio) {
    var entradas = [];

    festivos.forEach(function (f, i) {
      entradas.push({
        uid: "festivo-" + anio + "-" + i + "@siestaa42002-code",
        fecha: f.fecha,
        titulo: f.nombre,
        descripcion: "Festivo nacional de Colombia."
      });
    });

    eventos.forEach(function (e) {
      entradas.push(entradaDesdeEvento(e));
    });

    return construirICS(entradas, "Calendario " + anio);
  }

  function descargarTexto(contenido, nombreArchivo, tipoMime) {
    try {
      var blob = new Blob([contenido], { type: (tipoMime || "text/plain") + ";charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // Copia de seguridad
  // =========================================================================

  function exportarDatos() {
    return JSON.stringify({
      version: 2,
      exportado: new Date().toISOString(),
      eventos: cargarEventos()
    }, null, 2);
  }

  function importarDatos(texto, modo) {
    var datos;
    try {
      datos = JSON.parse(texto);
    } catch (e) {
      return { ok: false, error: "El archivo no tiene un formato válido." };
    }

    if (!datos || !Array.isArray(datos.eventos)) {
      return { ok: false, error: "El archivo no contiene eventos." };
    }

    var validos = datos.eventos
      .filter(function (e) {
        return e && typeof e.titulo === "string" && esFechaValida(e.fecha);
      })
      .map(migrar);

    if (validos.length === 0) {
      return { ok: false, error: "No se encontraron eventos válidos." };
    }

    if (modo === "reemplazar") {
      guardarEventos(validos);
      return { ok: true, cantidad: validos.length, modo: "reemplazar" };
    }

    var actuales = cargarEventos();
    var ids = {};
    actuales.forEach(function (e) { ids[e.id] = true; });

    validos.forEach(function (e) {
      if (!e.id || ids[e.id]) e.id = nuevoId();
      actuales.push(e);
    });

    guardarEventos(actuales);
    return { ok: true, cantidad: validos.length, modo: "fusionar" };
  }

  // =========================================================================
  // Compartir
  // =========================================================================

  function puedeCompartirNativo() {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
  }

  function compartir(datos) {
    if (puedeCompartirNativo()) {
      return navigator.share(datos)
        .then(function () { return { ok: true, via: "nativo" }; })
        .catch(function (e) {
          if (e && e.name === "AbortError") return { ok: false, via: "cancelado" };
          return copiarAlPortapapeles(textoPlano(datos));
        });
    }
    return copiarAlPortapapeles(textoPlano(datos));
  }

  function textoPlano(datos) {
    var partes = [];
    if (datos.text) partes.push(datos.text);
    if (datos.url) partes.push(datos.url);
    return partes.join("\n");
  }

  function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto)
        .then(function () { return { ok: true, via: "portapapeles" }; })
        .catch(function () { return copiarFallback(texto); });
    }
    return Promise.resolve(copiarFallback(texto));
  }

  function copiarFallback(texto) {
    try {
      var ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return { ok: ok, via: ok ? "portapapeles" : "fallo" };
    } catch (e) {
      return { ok: false, via: "fallo" };
    }
  }

  // =========================================================================
  // Búsqueda
  // =========================================================================

  function normalizar(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function buscar(termino, festivos, eventos) {
    var t = normalizar(termino).trim();
    if (t.length < 2) return [];

    var resultados = [];

    festivos.forEach(function (f) {
      if (normalizar(f.nombre).indexOf(t) !== -1) {
        resultados.push({ tipo: "festivo", fecha: f.fecha, titulo: f.nombre, dato: f });
      }
    });

    eventos.forEach(function (e) {
      if (normalizar(e.titulo).indexOf(t) !== -1 || normalizar(e.nota).indexOf(t) !== -1) {
        resultados.push({ tipo: "evento", fecha: e.fechaObj, titulo: e.titulo, dato: e });
      }
    });

    resultados.sort(function (a, b) { return a.fecha - b.fecha; });
    return resultados.slice(0, 30);
  }

  // =========================================================================
  // API pública
  // =========================================================================

  global.Eventos = {
    CATEGORIAS: CATEGORIAS,
    UNIDADES: UNIDADES,
    ATAJOS: ATAJOS,

    recordatorioVacio: recordatorioVacio,
    normalizarRecordatorio: normalizarRecordatorio,
    recordatorioEnMinutos: recordatorioEnMinutos,
    textoRecordatorio: textoRecordatorioCorto,

    cargar: cargarEventos,
    crear: crearEvento,
    actualizar: actualizarEvento,
    borrar: borrarEvento,
    obtener: obtenerEvento,
    delAnio: eventosDelAnio,
    diasDelEvento: diasDelEvento,
    textoRango: textoRango,

    instanteBogota: instanteBogota,
    esHoraValida: esHoraValida,
    esFechaValida: esFechaValida,

    soportaNotificaciones: soportaNotificaciones,
    permisoNotificaciones: permisoNotificaciones,
    pedirPermiso: pedirPermisoNotificaciones,
    pendientes: recordatoriosPendientes,
    marcarAvisado: marcarAvisado,
    textoCuentaAtras: textoCuentaAtras,
    notificar: lanzarNotificacion,

    icsDeFestivos: icsDeFestivos,
    icsDeEventos: icsDeEventos,
    icsMixto: icsMixto,
    descargar: descargarTexto,

    exportarDatos: exportarDatos,
    importarDatos: importarDatos,

    compartir: compartir,
    puedeCompartirNativo: puedeCompartirNativo,
    copiar: copiarAlPortapapeles,

    buscar: buscar,
    normalizar: normalizar
  };
})(typeof window !== "undefined" ? window : this);
