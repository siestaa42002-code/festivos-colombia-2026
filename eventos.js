/*
  Festivos - Módulo de eventos personales
  Autor: siestaa42002-code
  https://github.com/siestaa42002-code/festivos-colombia-2026
  Licencia: MIT
*/

(function (global) {
  "use strict";

  var CLAVE_EVENTOS = "festivos:eventos";
  var CLAVE_AVISADOS = "festivos:avisados";
  var CLAVE_PERMISO = "festivos:permisoPedido";

  // =========================================================================
  // Categorías
  // =========================================================================

  var CATEGORIAS = {
    cumpleanos: { nombre: "Cumpleaños", color: "#EC4899", icono: "●" },
    personal:   { nombre: "Personal",   color: "#8B5CF6", icono: "●" },
    trabajo:    { nombre: "Trabajo",    color: "#F59E0B", icono: "●" },
    salud:      { nombre: "Salud",      color: "#10B981", icono: "●" },
    viaje:      { nombre: "Viaje",      color: "#06B6D4", icono: "●" },
    pago:       { nombre: "Pago",       color: "#EF4444", icono: "●" },
    otro:       { nombre: "Otro",       color: "#64748B", icono: "●" }
  };

  var OPCIONES_RECORDATORIO = [
    { valor: -1, texto: "Sin recordatorio" },
    { valor: 0,  texto: "El mismo día" },
    { valor: 1,  texto: "1 día antes" },
    { valor: 3,  texto: "3 días antes" },
    { valor: 7,  texto: "1 semana antes" },
    { valor: 15, texto: "15 días antes" },
    { valor: 30, texto: "1 mes antes" }
  ];

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

  function cargarEventos() {
    var arr = leerLS(CLAVE_EVENTOS, []);
    return Array.isArray(arr) ? arr : [];
  }

  function guardarEventos(eventos) {
    return guardarLS(CLAVE_EVENTOS, eventos);
  }

  function nuevoId() {
    return "ev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  // =========================================================================
  // CRUD de eventos
  // =========================================================================

  function crearEvento(datos) {
    var eventos = cargarEventos();
    var evento = {
      id: nuevoId(),
      titulo: String(datos.titulo || "").trim().slice(0, 80),
      fecha: datos.fecha,
      nota: String(datos.nota || "").trim().slice(0, 300),
      categoria: CATEGORIAS[datos.categoria] ? datos.categoria : "personal",
      recordar: typeof datos.recordar === "number" ? datos.recordar : -1,
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

    if (datos.titulo !== undefined) eventos[i].titulo = String(datos.titulo).trim().slice(0, 80);
    if (datos.fecha !== undefined) eventos[i].fecha = datos.fecha;
    if (datos.nota !== undefined) eventos[i].nota = String(datos.nota).trim().slice(0, 300);
    if (datos.categoria !== undefined && CATEGORIAS[datos.categoria]) eventos[i].categoria = datos.categoria;
    if (datos.recordar !== undefined) eventos[i].recordar = datos.recordar;
    if (datos.anual !== undefined) eventos[i].anual = datos.anual === true;

    guardarEventos(eventos);
    return eventos[i];
  }

  function borrarEvento(id) {
    var eventos = cargarEventos().filter(function (e) { return e.id !== id; });
    guardarEventos(eventos);
    // Limpiar avisos de ese evento
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

  /*
    Devuelve los eventos que caen en un año concreto.
    Los marcados como anuales se proyectan a ese año.
  */
  function eventosDelAnio(anio) {
    var resultado = [];
    cargarEventos().forEach(function (e) {
      if (!e.fecha) return;
      var partes = e.fecha.split("-");
      if (partes.length !== 3) return;

      var anioOriginal = Number(partes[0]);
      var mes = Number(partes[1]);
      var dia = Number(partes[2]);

      if (e.anual) {
        // 29 de febrero en año no bisiesto pasa al 28
        var diaAjustado = dia;
        if (mes === 2 && dia === 29) {
          var bisiesto = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
          if (!bisiesto) diaAjustado = 28;
        }
        resultado.push(proyectar(e, anio, mes, diaAjustado, anioOriginal));
      } else if (anioOriginal === anio) {
        resultado.push(proyectar(e, anio, mes, dia, anioOriginal));
      }
    });

    resultado.sort(function (a, b) { return a.fechaObj - b.fechaObj; });
    return resultado;
  }

  function proyectar(evento, anio, mes, dia, anioOriginal) {
    var copia = {};
    Object.keys(evento).forEach(function (k) { copia[k] = evento[k]; });
    copia.fechaObj = global.crearFecha(anio, mes, dia);
    copia.anioOriginal = anioOriginal;
    copia.edad = evento.anual && anioOriginal < anio ? anio - anioOriginal : null;
    return copia;
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

  function yaPidioPermiso() {
    return leerLS(CLAVE_PERMISO, false) === true;
  }

  /*
    Revisa qué eventos tienen recordatorio para hoy (o vencido) y aún no se
    han avisado. Devuelve la lista, y opcionalmente lanza notificaciones.
  */
  function recordatoriosPendientes(hoy) {
    var pendientes = [];
    var avisados = leerLS(CLAVE_AVISADOS, {});
    var anioHoy = hoy.getUTCFullYear();

    // Revisar este año y el siguiente, por eventos de enero
    [anioHoy, anioHoy + 1].forEach(function (anio) {
      eventosDelAnio(anio).forEach(function (e) {
        if (typeof e.recordar !== "number" || e.recordar < 0) return;

        var fechaAviso = global.sumarDias(e.fechaObj, -e.recordar);
        var claveAviso = e.id + "|" + global.claveFecha(e.fechaObj);

        // Ya pasó la fecha del evento: no avisar
        if (e.fechaObj < hoy) return;
        // Todavía no toca avisar
        if (fechaAviso > hoy) return;
        // Ya se avisó
        if (avisados[claveAviso]) return;

        var diasFaltan = Math.round((e.fechaObj - hoy) / 86400000);
        pendientes.push({
          evento: e,
          diasFaltan: diasFaltan,
          claveAviso: claveAviso
        });
      });
    });

    return pendientes;
  }

  function marcarAvisado(claveAviso) {
    var avisados = leerLS(CLAVE_AVISADOS, {});
    avisados[claveAviso] = Date.now();
    guardarLS(CLAVE_AVISADOS, avisados);
  }

  function textoRecordatorio(pendiente) {
    var d = pendiente.diasFaltan;
    if (d === 0) return "Es hoy";
    if (d === 1) return "Es mañana";
    return "Faltan " + d + " días";
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

  function selloICS() {
    var ahora = new Date();
    return ahora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function plegarLinea(linea) {
    // iCalendar recomienda líneas de máximo 75 octetos
    if (linea.length <= 74) return linea;
    var partes = [];
    var resto = linea;
    partes.push(resto.slice(0, 74));
    resto = resto.slice(74);
    while (resto.length > 73) {
      partes.push(" " + resto.slice(0, 73));
      resto = resto.slice(73);
    }
    if (resto.length) partes.push(" " + resto);
    return partes.join("\r\n");
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

    entradas.forEach(function (entrada, i) {
      var inicio = entrada.fecha;
      var fin = global.sumarDias(inicio, 1);

      lineas.push("BEGIN:VEVENT");
      lineas.push("UID:" + (entrada.uid || ("festivos-" + fechaICS(inicio) + "-" + i + "@siestaa42002-code")));
      lineas.push("DTSTAMP:" + sello);
      lineas.push("DTSTART;VALUE=DATE:" + fechaICS(inicio));
      lineas.push("DTEND;VALUE=DATE:" + fechaICS(fin));
      lineas.push(plegarLinea("SUMMARY:" + escaparICS(entrada.titulo)));

      if (entrada.descripcion) {
        lineas.push(plegarLinea("DESCRIPTION:" + escaparICS(entrada.descripcion)));
      }
      if (entrada.anual) {
        lineas.push("RRULE:FREQ=YEARLY");
      }
      lineas.push("TRANSP:TRANSPARENT");

      // Alarma
      if (typeof entrada.recordar === "number" && entrada.recordar >= 0) {
        lineas.push("BEGIN:VALARM");
        lineas.push("ACTION:DISPLAY");
        lineas.push(plegarLinea("DESCRIPTION:" + escaparICS(entrada.titulo)));
        lineas.push("TRIGGER:-P" + entrada.recordar + "D");
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

  function icsDeEventos(eventos) {
    var entradas = eventos.map(function (e) {
      return {
        uid: e.id + "@siestaa42002-code",
        fecha: e.fechaObj || global.crearFecha.apply(null, e.fecha.split("-").map(Number)),
        titulo: e.titulo,
        descripcion: e.nota,
        anual: e.anual,
        recordar: e.recordar
      };
    });
    return construirICS(entradas, "Mis eventos");
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
      version: 1,
      exportado: new Date().toISOString(),
      eventos: cargarEventos()
    }, null, 2);
  }

  function importarDatos(texto, modo) {
    // modo: "reemplazar" o "fusionar"
    var datos;
    try {
      datos = JSON.parse(texto);
    } catch (e) {
      return { ok: false, error: "El archivo no tiene un formato válido." };
    }

    if (!datos || !Array.isArray(datos.eventos)) {
      return { ok: false, error: "El archivo no contiene eventos." };
    }

    var validos = datos.eventos.filter(function (e) {
      return e && typeof e.titulo === "string" && typeof e.fecha === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(e.fecha);
    });

    if (validos.length === 0) {
      return { ok: false, error: "No se encontraron eventos válidos." };
    }

    if (modo === "reemplazar") {
      guardarEventos(validos);
      return { ok: true, cantidad: validos.length, modo: "reemplazar" };
    }

    var actuales = cargarEventos();
    var idsActuales = {};
    actuales.forEach(function (e) { idsActuales[e.id] = true; });

    var nuevos = 0;
    validos.forEach(function (e) {
      if (!e.id || idsActuales[e.id]) {
        e.id = nuevoId();
      }
      actuales.push(e);
      nuevos++;
    });

    guardarEventos(actuales);
    return { ok: true, cantidad: nuevos, modo: "fusionar" };
  }

  // =========================================================================
  // Compartir
  // =========================================================================

  function puedeCompartirNativo() {
    return typeof navigator !== "undefined" && typeof navigator.share === "function";
  }

  function compartir(datos) {
    // datos: { title, text, url }
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
  // Exportación pública
  // =========================================================================

  global.Eventos = {
    CATEGORIAS: CATEGORIAS,
    OPCIONES_RECORDATORIO: OPCIONES_RECORDATORIO,

    cargar: cargarEventos,
    crear: crearEvento,
    actualizar: actualizarEvento,
    borrar: borrarEvento,
    obtener: obtenerEvento,
    delAnio: eventosDelAnio,

    soportaNotificaciones: soportaNotificaciones,
    permisoNotificaciones: permisoNotificaciones,
    pedirPermiso: pedirPermisoNotificaciones,
    yaPidioPermiso: yaPidioPermiso,
    pendientes: recordatoriosPendientes,
    marcarAvisado: marcarAvisado,
    textoRecordatorio: textoRecordatorio,
    notificar: lanzarNotificacion,

    icsDeFestivos: icsDeFestivos,
    icsDeEventos: icsDeEventos,
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
