/*
  Festivos - Calendario de dias festivos
  Autor: siestaa42002-code
  https://github.com/siestaa42002-code/festivos-colombia-2026
  Licencia: MIT
*/

// ===========================================================================
// Calculo de Pascua (Meeus/Jones/Butcher, calendario gregoriano)
// ===========================================================================

function calcularPascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return { mes: mes, dia: dia };
}

// ===========================================================================
// Helpers de fecha (todo en UTC para evitar desfases de zona horaria)
// ===========================================================================

function crearFecha(anio, mes, dia) {
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function sumarDias(fecha, dias) {
  const nueva = new Date(fecha.getTime());
  nueva.setUTCDate(nueva.getUTCDate() + dias);
  return nueva;
}

function trasladarALunes(fecha) {
  const diaSemana = fecha.getUTCDay();
  if (diaSemana === 1) return fecha;
  const diasHastaLunes = (8 - diaSemana) % 7;
  return sumarDias(fecha, diasHastaLunes === 0 ? 7 : diasHastaLunes);
}

function claveFecha(fecha) {
  const y = fecha.getUTCFullYear();
  const m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const d = String(fecha.getUTCDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function hoyEnBogota() {
  // La fecha de hoy segun Bogota (UTC-5), sin importar donde este el dispositivo
  const ahora = new Date();
  const utcMs = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const bogota = new Date(utcMs - 5 * 3600000);
  return crearFecha(bogota.getFullYear(), bogota.getMonth() + 1, bogota.getDate());
}

// ===========================================================================
// Nombres
// ===========================================================================

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const DIAS_SEMANA_CORTO = ["D", "L", "M", "M", "J", "V", "S"];

function formatearFechaLarga(fecha) {
  const dia = fecha.getUTCDate();
  const mes = MESES[fecha.getUTCMonth()];
  const diaSem = DIAS_SEMANA[fecha.getUTCDay()];
  return diaSem + " " + dia + " de " + mes;
}

// ===========================================================================
// Festivos de Colombia
// ===========================================================================

function festivosColombia(anio) {
  const pascua = calcularPascua(anio);
  const domingoPascua = crearFecha(anio, pascua.mes, pascua.dia);
  const lista = [];

  // Fijos: no se trasladan
  const fijos = [
    { mes: 1, dia: 1, nombre: "Ano Nuevo" },
    { mes: 5, dia: 1, nombre: "Dia del Trabajo" },
    { mes: 7, dia: 20, nombre: "Dia de la Independencia" },
    { mes: 8, dia: 7, nombre: "Batalla de Boyaca" },
    { mes: 12, dia: 8, nombre: "Inmaculada Concepcion" },
    { mes: 12, dia: 25, nombre: "Navidad" }
  ];

  fijos.forEach(function (f) {
    lista.push({
      fecha: crearFecha(anio, f.mes, f.dia),
      nombre: f.nombre,
      tipo: "fijo",
      trasladado: false
    });
  });

  // Trasladables al lunes siguiente (Ley Emiliani)
  const trasladables = [
    { mes: 1, dia: 6, nombre: "Dia de los Reyes Magos" },
    { mes: 3, dia: 19, nombre: "Dia de San Jose" },
    { mes: 6, dia: 29, nombre: "San Pedro y San Pablo" },
    { mes: 8, dia: 15, nombre: "Asuncion de la Virgen" },
    { mes: 10, dia: 12, nombre: "Dia de la Raza" },
    { mes: 11, dia: 1, nombre: "Dia de Todos los Santos" },
    { mes: 11, dia: 11, nombre: "Independencia de Cartagena" }
  ];

  trasladables.forEach(function (f) {
    const original = crearFecha(anio, f.mes, f.dia);
    const movido = trasladarALunes(original);
    lista.push({
      fecha: movido,
      nombre: f.nombre,
      tipo: "trasladable",
      trasladado: claveFecha(original) !== claveFecha(movido),
      fechaOriginal: original
    });
  });

  // Moviles ligados a Pascua, no se trasladan
  lista.push({
    fecha: sumarDias(domingoPascua, -3),
    nombre: "Jueves Santo",
    tipo: "movil",
    trasladado: false
  });
  lista.push({
    fecha: sumarDias(domingoPascua, -2),
    nombre: "Viernes Santo",
    tipo: "movil",
    trasladado: false
  });

  // Moviles ligados a Pascua que si se trasladan al lunes
  lista.push({
    fecha: sumarDias(domingoPascua, 43),
    nombre: "Ascension del Senor",
    tipo: "movil",
    trasladado: true,
    fechaOriginal: sumarDias(domingoPascua, 39)
  });
  lista.push({
    fecha: sumarDias(domingoPascua, 64),
    nombre: "Corpus Christi",
    tipo: "movil",
    trasladado: true,
    fechaOriginal: sumarDias(domingoPascua, 60)
  });
  lista.push({
    fecha: sumarDias(domingoPascua, 71),
    nombre: "Sagrado Corazon de Jesus",
    tipo: "movil",
    trasladado: true,
    fechaOriginal: sumarDias(domingoPascua, 68)
  });

  lista.sort(function (a, b) { return a.fecha - b.fecha; });
  return lista;
}

// ===========================================================================
// Otros paises (comparador)
// ===========================================================================

function mapaFijos(anio, arr) {
  return arr.map(function (f) {
    return {
      fecha: crearFecha(anio, f.mes, f.dia),
      nombre: f.nombre,
      tipo: "fijo",
      trasladado: false
    };
  });
}

function festivosMexico(anio) {
  return mapaFijos(anio, [
    { mes: 1, dia: 1, nombre: "Ano Nuevo" },
    { mes: 2, dia: 5, nombre: "Dia de la Constitucion" },
    { mes: 3, dia: 21, nombre: "Natalicio de Benito Juarez" },
    { mes: 5, dia: 1, nombre: "Dia del Trabajo" },
    { mes: 9, dia: 16, nombre: "Dia de la Independencia" },
    { mes: 11, dia: 20, nombre: "Revolucion Mexicana" },
    { mes: 12, dia: 25, nombre: "Navidad" }
  ]).sort(function (a, b) { return a.fecha - b.fecha; });
}

function festivosEspana(anio) {
  const pascua = calcularPascua(anio);
  const dp = crearFecha(anio, pascua.mes, pascua.dia);
  const lista = mapaFijos(anio, [
    { mes: 1, dia: 1, nombre: "Ano Nuevo" },
    { mes: 1, dia: 6, nombre: "Epifania del Senor" },
    { mes: 5, dia: 1, nombre: "Fiesta del Trabajo" },
    { mes: 8, dia: 15, nombre: "Asuncion de la Virgen" },
    { mes: 10, dia: 12, nombre: "Fiesta Nacional" },
    { mes: 11, dia: 1, nombre: "Todos los Santos" },
    { mes: 12, dia: 6, nombre: "Dia de la Constitucion" },
    { mes: 12, dia: 8, nombre: "Inmaculada Concepcion" },
    { mes: 12, dia: 25, nombre: "Navidad" }
  ]);
  lista.push({ fecha: sumarDias(dp, -2), nombre: "Viernes Santo", tipo: "movil", trasladado: false });
  return lista.sort(function (a, b) { return a.fecha - b.fecha; });
}

function festivosPeru(anio) {
  const pascua = calcularPascua(anio);
  const dp = crearFecha(anio, pascua.mes, pascua.dia);
  const lista = mapaFijos(anio, [
    { mes: 1, dia: 1, nombre: "Ano Nuevo" },
    { mes: 5, dia: 1, nombre: "Dia del Trabajo" },
    { mes: 6, dia: 29, nombre: "San Pedro y San Pablo" },
    { mes: 7, dia: 28, nombre: "Fiestas Patrias" },
    { mes: 7, dia: 29, nombre: "Fiestas Patrias" },
    { mes: 8, dia: 30, nombre: "Santa Rosa de Lima" },
    { mes: 10, dia: 8, nombre: "Combate de Angamos" },
    { mes: 11, dia: 1, nombre: "Todos los Santos" },
    { mes: 12, dia: 8, nombre: "Inmaculada Concepcion" },
    { mes: 12, dia: 25, nombre: "Navidad" }
  ]);
  lista.push({ fecha: sumarDias(dp, -3), nombre: "Jueves Santo", tipo: "movil", trasladado: false });
  lista.push({ fecha: sumarDias(dp, -2), nombre: "Viernes Santo", tipo: "movil", trasladado: false });
  return lista.sort(function (a, b) { return a.fecha - b.fecha; });
}

function festivosEcuador(anio) {
  const pascua = calcularPascua(anio);
  const dp = crearFecha(anio, pascua.mes, pascua.dia);
  const lista = mapaFijos(anio, [
    { mes: 1, dia: 1, nombre: "Ano Nuevo" },
    { mes: 5, dia: 1, nombre: "Dia del Trabajo" },
    { mes: 5, dia: 24, nombre: "Batalla de Pichincha" },
    { mes: 8, dia: 10, nombre: "Primer Grito de Independencia" },
    { mes: 10, dia: 9, nombre: "Independencia de Guayaquil" },
    { mes: 11, dia: 2, nombre: "Dia de los Difuntos" },
    { mes: 11, dia: 3, nombre: "Independencia de Cuenca" },
    { mes: 12, dia: 25, nombre: "Navidad" }
  ]);
  lista.push({ fecha: sumarDias(dp, -2), nombre: "Viernes Santo", tipo: "movil", trasladado: false });
  lista.push({ fecha: sumarDias(dp, -48), nombre: "Carnaval", tipo: "movil", trasladado: false });
  lista.push({ fecha: sumarDias(dp, -47), nombre: "Carnaval", tipo: "movil", trasladado: false });
  return lista.sort(function (a, b) { return a.fecha - b.fecha; });
}

const PAISES = {
  co: { nombre: "Colombia", fn: festivosColombia },
  mx: { nombre: "Mexico", fn: festivosMexico },
  es: { nombre: "Espana", fn: festivosEspana },
  pe: { nombre: "Peru", fn: festivosPeru },
  ec: { nombre: "Ecuador", fn: festivosEcuador }
};

function obtenerFestivos(pais, anio) {
  const p = PAISES[pais] || PAISES.co;
  return p.fn(anio);
}

// ===========================================================================
// Utilidades de calculo
// ===========================================================================

function esFinDeSemana(fecha) {
  const d = fecha.getUTCDay();
  return d === 0 || d === 6;
}

function detectarPuentes(festivos) {
  return festivos.filter(function (f) {
    const d = f.fecha.getUTCDay();
    return d === 1 || d === 5;
  });
}

function contarDiasHabiles(inicio, fin, festivos) {
  const claves = {};
  festivos.forEach(function (f) { claves[claveFecha(f.fecha)] = true; });
  let count = 0;
  let cursor = new Date(inicio.getTime());
  let guardia = 0;
  while (cursor <= fin && guardia < 20000) {
    const d = cursor.getUTCDay();
    if (d !== 0 && d !== 6 && !claves[claveFecha(cursor)]) count++;
    cursor = sumarDias(cursor, 1);
    guardia++;
  }
  return count;
}

function esDiaLibre(fecha, claves) {
  return esFinDeSemana(fecha) || claves[claveFecha(fecha)] === true;
}

/*
  Busca ventanas donde pedir pocos dias de vacaciones genera muchos dias
  libres seguidos. Para cada festivo entre semana, prueba tomar de 1 a
  maxDias habiles inmediatamente antes o despues y mide el bloque libre
  resultante.
*/
function sugerirVacaciones(festivos, anio, maxDias) {
  maxDias = maxDias || 4;
  const claves = {};
  festivos.forEach(function (f) { claves[claveFecha(f.fecha)] = true; });

  const candidatos = [];

  festivos.forEach(function (festivo) {
    const d = festivo.fecha.getUTCDay();
    if (d === 0 || d === 6) return;

    ["despues", "antes"].forEach(function (direccion) {
      for (let n = 1; n <= maxDias; n++) {
        const pedidos = [];
        let cursor = festivo.fecha;
        let intentos = 0;

        // Reunir n dias habiles consecutivos en la direccion indicada
        while (pedidos.length < n && intentos < 30) {
          cursor = sumarDias(cursor, direccion === "despues" ? 1 : -1);
          intentos++;
          if (!esDiaLibre(cursor, claves)) pedidos.push(new Date(cursor.getTime()));
        }
        if (pedidos.length < n) continue;

        const pedidosClaves = {};
        pedidos.forEach(function (p) { pedidosClaves[claveFecha(p)] = true; });

        const libre = function (fecha) {
          return esDiaLibre(fecha, claves) || pedidosClaves[claveFecha(fecha)] === true;
        };

        // Expandir el bloque libre alrededor del festivo
        let ini = new Date(festivo.fecha.getTime());
        let g = 0;
        while (libre(sumarDias(ini, -1)) && g < 40) { ini = sumarDias(ini, -1); g++; }

        let fin = new Date(festivo.fecha.getTime());
        g = 0;
        while (libre(sumarDias(fin, 1)) && g < 40) { fin = sumarDias(fin, 1); g++; }

        const diasLibres = Math.round((fin - ini) / 86400000) + 1;
        const ratio = diasLibres / n;

        if (ratio >= 2) {
          candidatos.push({
            festivo: festivo.nombre,
            fechaFestivo: festivo.fecha,
            inicio: ini,
            fin: fin,
            diasPedidos: n,
            diasLibres: diasLibres,
            ratio: Math.round(ratio * 10) / 10,
            primerPedido: pedidos[0],
            ultimoPedido: pedidos[pedidos.length - 1],
            direccion: direccion
          });
        }
      }
    });
  });

  // Quedarse con la mejor opcion por festivo
  const mejores = {};
  candidatos.forEach(function (c) {
    const key = c.festivo + "|" + claveFecha(c.fechaFestivo);
    const actual = mejores[key];
    if (!actual || c.ratio > actual.ratio || (c.ratio === actual.ratio && c.diasLibres > actual.diasLibres)) {
      mejores[key] = c;
    }
  });

  return Object.keys(mejores)
    .map(function (k) { return mejores[k]; })
    .sort(function (a, b) {
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      return b.diasLibres - a.diasLibres;
    })
    .slice(0, 8);
}

// ===========================================================================
// Exportacion explicita al ambito global
// Garantiza que script.js encuentre todo, sin importar como se cargue
// ===========================================================================

(function (global) {
  global.calcularPascua = calcularPascua;
  global.crearFecha = crearFecha;
  global.sumarDias = sumarDias;
  global.trasladarALunes = trasladarALunes;
  global.claveFecha = claveFecha;
  global.hoyEnBogota = hoyEnBogota;
  global.MESES = MESES;
  global.DIAS_SEMANA = DIAS_SEMANA;
  global.DIAS_SEMANA_CORTO = DIAS_SEMANA_CORTO;
  global.formatearFechaLarga = formatearFechaLarga;
  global.festivosColombia = festivosColombia;
  global.PAISES = PAISES;
  global.obtenerFestivos = obtenerFestivos;
  global.esFinDeSemana = esFinDeSemana;
  global.detectarPuentes = detectarPuentes;
  global.contarDiasHabiles = contarDiasHabiles;
  global.sugerirVacaciones = sugerirVacaciones;
})(typeof window !== "undefined" ? window : this);
