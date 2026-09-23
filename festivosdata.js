/*
  Festivos - Calendario de días festivos
  Autor: siestaa42002-code
  https://github.com/siestaa42002-code/festivos-colombia-2026
*/

// ===========================================================================
// Cálculo de Pascua (algoritmo de Meeus/Jones/Butcher, calendario gregoriano)
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
// Helpers de fecha (todo en UTC para evitar desfases por zona horaria)
// ===========================================================================

function crearFecha(anio, mes, dia) {
  // mes: 1-12
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function sumarDias(fecha, dias) {
  const nueva = new Date(fecha.getTime());
  nueva.setUTCDate(nueva.getUTCDate() + dias);
  return nueva;
}

function trasladarALunes(fecha) {
  // Ley Emiliani: si no cae lunes, se traslada al lunes siguiente
  const diaSemana = fecha.getUTCDay(); // 0 domingo, 1 lunes
  if (diaSemana === 1) return fecha;
  const diasHastaLunes = (8 - diaSemana) % 7;
  return sumarDias(fecha, diasHastaLunes === 0 ? 7 : diasHastaLunes);
}

function claveFecha(fecha) {
  const y = fecha.getUTCFullYear();
  const m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const d = String(fecha.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hoyEnBogota() {
  // Siempre calcula la fecha actual según Bogotá (UTC-5),
  // sin importar la zona horaria del dispositivo.
  const ahora = new Date();
  const utcMs = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  const bogotaMs = utcMs - 5 * 3600000;
  const bogota = new Date(bogotaMs);
  return crearFecha(bogota.getFullYear(), bogota.getMonth() + 1, bogota.getDate());
}

// ===========================================================================
// Festivos de Colombia
// ===========================================================================

function festivosColombia(anio) {
  const pascua = calcularPascua(anio);
  const domingoPascua = crearFecha(anio, pascua.mes, pascua.dia);

  const lista = [];

  // Fijos (no se trasladan)
  const fijos = [
    { mes: 1, dia: 1, nombre: "Año Nuevo" },
    { mes: 5, dia: 1, nombre: "Día del Trabajo" },
    { mes: 7, dia: 20, nombre: "Día de la Independencia" },
    { mes: 8, dia: 7, nombre: "Batalla de Boyacá" },
    { mes: 12, dia: 8, nombre: "Inmaculada Concepción" },
    { mes: 12, dia: 25, nombre: "Navidad" },
  ];

  fijos.forEach((f) => {
    lista.push({
      fecha: crearFecha(anio, f.mes, f.dia),
      nombre: f.nombre,
      tipo: "fijo",
      trasladado: false,
    });
  });

  // Trasladables al lunes (Ley Emiliani)
  const trasladables = [
    { mes: 1, dia: 6, nombre: "Día de los Reyes Magos" },
    { mes: 3, dia: 19, nombre: "Día de San José" },
    { mes: 6, dia: 29, nombre: "San Pedro y San Pablo" },
    { mes: 8, dia: 15, nombre: "Asunción de la Virgen" },
    { mes: 10, dia: 12, nombre: "Día de la Raza" },
    { mes: 11, dia: 1, nombre: "Día de Todos los Santos" },
    { mes: 11, dia: 11, nombre: "Independencia de Cartagena" },
  ];

  trasladables.forEach((f) => {
    const original = crearFecha(anio, f.mes, f.dia);
    const movido = trasladarALunes(original);
    lista.push({
      fecha: movido,
      nombre: f.nombre,
      tipo: "trasladable",
      trasladado: claveFecha(original) !== claveFecha(movido),
      fechaOriginal: original,
    });
  });

  // Móviles ligados a Pascua (no se trasladan)
  lista.push({
    fecha: sumarDias(domingoPascua, -3),
    nombre: "Jueves Santo",
    tipo: "movil",
    trasladado: false,
  });
  lista.push({
    fecha: sumarDias(domingoPascua, -2),
    nombre: "Viernes Santo",
    tipo: "movil",
    trasladado: false,
  });

  // Móviles ligados a Pascua que sí se trasladan al lunes
  lista.push({
    fecha: sumarDias(domingoPascua, 43),
    nombre: "Ascensión del Señor",
    tipo: "movil",
    trasladado: true,
    fechaOriginal: sumarDias(domingoPascua, 39),
  });
  lista.push({
    fecha: sumarDias(domingoPascua, 64),
    nombre: "Corpus Christi",
    tipo: "movil",
    trasladado: true,
    fechaOriginal: sumarDias(domingoPascua, 60),
  });
  lista.push({
    fecha: sumarDias(domingoPascua, 71),
    nombre: "Sagrado Corazón de Jesús",
    tipo: "movil",
    trasladado: true,
    fechaOriginal: sumarDias(domingoPascua, 68),
  });

  lista.sort((a, b) => a.fecha - b.fecha);
  return lista;
}

// ===========================================================================
// Festivos de otros países (comparador)
// ===========================================================================

function festivosMexico(anio) {
  const lista = [
    { mes: 1, dia: 1, nombre: "Año Nuevo" },
    { mes: 2, dia: 5, nombre: "Día de la Constitución" },
    { mes: 3, dia: 21, nombre: "Natalicio de Benito Juárez" },
    { mes: 5, dia: 1, nombre: "Día del Trabajo" },
    { mes: 9, dia: 16, nombre: "Día de la Independencia" },
    { mes: 11, dia: 20, nombre: "Revolución Mexicana" },
    { mes: 12, dia: 25, nombre: "Navidad" },
  ];
  return lista.map((f) => ({
    fecha: crearFecha(anio, f.mes, f.dia),
    nombre: f.nombre,
    tipo: "fijo",
    trasladado: false,
  })).sort((a, b) => a.fecha - b.fecha);
}

function festivosEspana(anio) {
  const pascua = calcularPascua(anio);
  const domingoPascua = crearFecha(anio, pascua.mes, pascua.dia);
  const lista = [
    { mes: 1, dia: 1, nombre: "Año Nuevo" },
    { mes: 1, dia: 6, nombre: "Epifanía del Señor" },
    { mes: 5, dia: 1, nombre: "Fiesta del Trabajo" },
    { mes: 8, dia: 15, nombre: "Asunción de la Virgen" },
    { mes: 10, dia: 12, nombre: "Fiesta Nacional" },
    { mes: 11, dia: 1, nombre: "Todos los Santos" },
    { mes: 12, dia: 6, nombre: "Día de la Constitución" },
    { mes: 12, dia: 8, nombre: "Inmaculada Concepción" },
    { mes: 12, dia: 25, nombre: "Navidad" },
  ].map((f) => ({
    fecha: crearFecha(anio, f.mes, f.dia),
    nombre: f.nombre,
    tipo: "fijo",
    trasladado: false,
  }));

  lista.push({
    fecha: sumarDias(domingoPascua, -2),
    nombre: "Viernes Santo",
    tipo: "movil",
    trasladado: false,
  });

  return lista.sort((a, b) => a.fecha - b.fecha);
}

function festivosPeru(anio) {
  const pascua = calcularPascua(anio);
  const domingoPascua = crearFecha(anio, pascua.mes, pascua.dia);
  const lista = [
    { mes: 1, dia: 1, nombre: "Año Nuevo" },
    { mes: 5, dia: 1, nombre: "Día del Trabajo" },
    { mes: 6, dia: 29, nombre: "San Pedro y San Pablo" },
    { mes: 7, dia: 28, nombre: "Fiestas Patrias" },
    { mes: 7, dia: 29, nombre: "Fiestas Patrias" },
    { mes: 8, dia: 30, nombre: "Santa Rosa de Lima" },
    { mes: 10, dia: 8, nombre: "Combate de Angamos" },
    { mes: 11, dia: 1, nombre: "Todos los Santos" },
    { mes: 12, dia: 8, nombre: "Inmaculada Concepción" },
    { mes: 12, dia: 25, nombre: "Navidad" },
  ].map((f) => ({
    fecha: crearFecha(anio, f.mes, f.dia),
    nombre: f.nombre,
    tipo: "fijo",
    trasladado: false,
  }));

  lista.push({
    fecha: sumarDias(domingoPascua, -3),
    nombre: "Jueves Santo",
    tipo: "movil",
    trasladado: false,
  });
  lista.push({
    fecha: sumarDias(domingoPascua, -2),
    nombre: "Viernes Santo",
    tipo: "movil",
    trasladado: false,
  });

  return lista.sort((a, b) => a.fecha - b.fecha);
}

function festivosEcuador(anio) {
  const pascua = calcularPascua(anio);
  const domingoPascua = crearFecha(anio, pascua.mes, pascua.dia);
  const lista = [
    { mes: 1, dia: 1, nombre: "Año Nuevo" },
    { mes: 5, dia: 1, nombre: "Día del Trabajo" },
    { mes: 5, dia: 24, nombre: "Batalla de Pichincha" },
    { mes: 8, dia: 10, nombre: "Primer Grito de Independencia" },
    { mes: 10, dia: 9, nombre: "Independencia de Guayaquil" },
    { mes: 11, dia: 2, nombre: "Día de los Difuntos" },
    { mes: 11, dia: 3, nombre: "Independencia de Cuenca" },
    { mes: 12, dia: 25, nombre: "Navidad" },
  ].map((f) => ({
    fecha: crearFecha(anio, f.mes, f.dia),
    nombre: f.nombre,
    tipo: "fijo",
    trasladado: false,
  }));

  lista.push({
    fecha: sumarDias(domingoPascua, -2),
    nombre: "Viernes Santo",
    tipo: "movil",
    trasladado: false,
  });
  lista.push({
    fecha: sumarDias(domingoPascua, -48),
    nombre: "Carnaval",
    tipo: "movil",
    trasladado: false,
  });
  lista.push({
    fecha: sumarDias(domingoPascua, -47),
    nombre: "Carnaval",
    tipo: "movil",
    trasladado: false,
  });

  return lista.sort((a, b) => a.fecha - b.fecha);
}

const PAISES = {
  co: { nombre: "Colombia", fn: festivosColombia },
  mx: { nombre: "México", fn: festivosMexico },
  es: { nombre: "España", fn: festivosEspana },
  pe: { nombre: "Perú", fn: festivosPeru },
  ec: { nombre: "Ecuador", fn: festivosEcuador },
};

function obtenerFestivos(pais, anio) {
  const p = PAISES[pais] || PAISES.co;
  return p.fn(anio);
}

// ===========================================================================
// Utilidades de cálculo
// ===========================================================================

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_SEMANA_CORTO = ["D", "L", "M", "M", "J", "V", "S"];

function formatearFechaLarga(fecha) {
  const dia = fecha.getUTCDate();
  const mes = MESES[fecha.getUTCMonth()];
  const diaSem = DIAS_SEMANA[fecha.getUTCDay()];
  return `${diaSem} ${dia} de ${mes}`;
}

function esFinDeSemana(fecha) {
  const d = fecha.getUTCDay();
  return d === 0 || d === 6;
}

function detectarPuentes(festivos) {
  // Un puente es un festivo que cae lunes o viernes
  return festivos.filter((f) => {
    const d = f.fecha.getUTCDay();
    return d === 1 || d === 5;
  });
}

function contarDiasHabiles(inicio, fin, festivos) {
  const clavesFestivos = new Set(festivos.map((f) => claveFecha(f.fecha)));
  let count = 0;
  let cursor = new Date(inicio.getTime());
  while (cursor <= fin) {
    const d = cursor.getUTCDay();
    const esHabil = d !== 0 && d !== 6 && !clavesFestivos.has(claveFecha(cursor));
    if (esHabil) count++;
    cursor = sumarDias(cursor, 1);
  }
  return count;
}

function sugerirVacaciones(festivos, anio, diasDisponibles = 5) {
  // Busca ventanas donde pocos días de vacaciones generan muchos días libres
  const clavesFestivos = new Set(festivos.map((f) => claveFecha(f.fecha)));
  const sugerencias = [];

  festivos.forEach((festivo) => {
    const d = festivo.fecha.getUTCDay();
    // Solo tiene sentido buscar alrededor de festivos entre semana
    if (d === 0 || d === 6) return;

    for (let extra = 1; extra <= diasDisponibles; extra++) {
      // Probar tomando días después del festivo
      const inicio = festivo.fecha;
      const fin = sumarDias(festivo.fecha, extra + 4);
      const libresTotales = contarDiasLibresConsecutivos(inicio, fin, clavesFestivos);
      const habilesGastados = contarDiasHabiles(sumarDias(inicio, 1), sumarDias(inicio, extra), festivos);

      if (habilesGastados > 0 && libresTotales / habilesGastados >= 2) {
        sugerencias.push({
          festivo: festivo.nombre,
          inicio: inicio,
          diasPedidos: habilesGastados,
          diasLibres: libresTotales,
          ratio: (libresTotales / habilesGastados).toFixed(1),
        });
      }
    }
  });

  // Quedarse con la mejor por festivo
  const mejores = {};
  sugerencias.forEach((s) => {
    const key = s.festivo + claveFecha(s.inicio);
    if (!mejores[key] || parseFloat(s.ratio) > parseFloat(mejores[key].ratio)) {
      mejores[key] = s;
    }
  });

  return Object.values(mejores)
    .sort((a, b) => parseFloat(b.ratio) - parseFloat(a.ratio))
    .slice(0, 6);
}

function contarDiasLibresConsecutivos(inicio, fin, clavesFestivos) {
  let count = 0;
  let cursor = new Date(inicio.getTime());
  while (cursor <= fin) {
    count++;
    cursor = sumarDias(cursor, 1);
  }
  return count;
}