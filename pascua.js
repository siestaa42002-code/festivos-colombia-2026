// Cálculo de Pascua (algoritmo de Meeus/Jones/Butcher) y derivados.
// Devuelve fechas en formato YYYY-MM-DD ancladas a Bogotá.

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
  return { mes, dia };
}

// Helper: sumar N días a una fecha {anio, mes, dia}
function sumarDias(anio, mes, dia, dias) {
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  d.setUTCDate(d.getUTCDate() + dias);
  return {
    anio: d.getUTCFullYear(),
    mes: d.getUTCMonth() + 1,
    dia: d.getUTCDate(),
  };
}

function formatearISO(anio, mes, dia) {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// Traslada al lunes siguiente si no cae en lunes (Ley Emiliani)
function trasladarALunes(anio, mes, dia) {
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  const diaSemana = d.getUTCDay(); // 0 = domingo, 1 = lunes
  if (diaSemana === 1) {
    return { anio, mes, dia };
  }
  // Cuántos días faltan para el próximo lunes
  const diasHastaLunes = diaSemana === 0 ? 1 : 8 - diaSemana;
  return sumarDias(anio, mes, dia, diasHastaLunes);
}

// Genera todos los festivos oficiales de Colombia para un año dado
function generarFestivosColombia(anio) {
  const pascua = calcularPascua(anio);
  const festivos = [];

  // Festivos de fecha fija
  festivos.push({ fecha: formatearISO(anio, 1, 1), nombre: "Año Nuevo", tipo: "fija" });
  festivos.push({ fecha: formatearISO(anio, 5, 1), nombre: "Día del Trabajo", tipo: "fija" });
  festivos.push({ fecha: formatearISO(anio, 7, 20), nombre: "Día de la Independencia", tipo: "fija" });
  festivos.push({ fecha: formatearISO(anio, 8, 7), nombre: "Batalla de Boyacá", tipo: "fija" });
  festivos.push({ fecha: formatearISO(anio, 12, 8), nombre: "Inmaculada Concepción", tipo: "fija" });
  festivos.push({ fecha: formatearISO(anio, 12, 25), nombre: "Navidad", tipo: "fija" });

  // Jueves Santo (3 días antes de Pascua) y Viernes Santo (2 días antes)
  const juevesSanto = sumarDias(anio, pascua.mes, pascua.dia, -3);
  const viernesSanto = sumarDias(anio, pascua.mes, pascua.dia, -2);
  festivos.push({ fecha: formatearISO(juevesSanto.anio, juevesSanto.mes, juevesSanto.dia), nombre: "Jueves Santo", tipo: "fija" });
  festivos.push({ fecha: formatearISO(viernesSanto.anio, viernesSanto.mes, viernesSanto.dia), nombre: "Viernes Santo", tipo: "fija" });

  // Festivos trasladados al lunes (Ley Emiliani)
  // Reyes Magos: 6 de enero
  const reyes = trasladarALunes(anio, 1, 6);
  festivos.push({ fecha: formatearISO(reyes.anio, reyes.mes, reyes.dia), nombre: "Día de los Reyes Magos", tipo: "emiliani" });

  // San José: 19 de marzo
  const sanJose = trasladarALunes(anio, 3, 19);
  festivos.push({ fecha: formatearISO(sanJose.anio, sanJose.mes, sanJose.dia), nombre: "Día de San José", tipo: "emiliani" });

  // Ascensión del Señor: 40 días después de Pascua (43 días = 40 días + 3, pero se cuenta 39 después)
  // En la práctica son 39 días después del Domingo de Resurrección, y se traslada al lunes
  const ascension = sumarDias(anio, pascua.mes, pascua.dia, 39);
  const ascensionTrasladada = trasladarALunes(ascension.anio, ascension.mes, ascension.dia);
  festivos.push({ fecha: formatearISO(ascensionTrasladada.anio, ascensionTrasladada.mes, ascensionTrasladada.dia), nombre: "Ascensión del Señor", tipo: "emiliani" });

  // Corpus Christi: 60 días después de Pascua
  const corpus = sumarDias(anio, pascua.mes, pascua.dia, 60);
  const corpusTrasladado = trasladarALunes(corpus.anio, corpus.mes, corpus.dia);
  festivos.push({ fecha: formatearISO(corpusTrasladado.anio, corpusTrasladado.mes, corpusTrasladado.dia), nombre: "Corpus Christi", tipo: "emiliani" });

  // Sagrado Corazón: 68 días después de Pascua
  const sagrado = sumarDias(anio, pascua.mes, pascua.dia, 68);
  const sagradoTrasladado = trasladarALunes(sagrado.anio, sagrado.mes, sagrado.dia);
  festivos.push({ fecha: formatearISO(sagradoTrasladado.anio, sagradoTrasladado.mes, sagradoTrasladado.dia), nombre: "Sagrado Corazón", tipo: "emiliani" });

  // San Pedro y San Pablo: 29 de junio
  const sanPedro = trasladarALunes(anio, 6, 29);
  festivos.push({ fecha: formatearISO(sanPedro.anio, sanPedro.mes, sanPedro.dia), nombre: "San Pedro y San Pablo", tipo: "emiliani" });

  // Virgen de Chiquinquirá: 9 de julio (nuevo desde Ley 2462 de 2025)
  if (anio >= 2026) {
    const chiquinquira = trasladarALunes(anio, 7, 9);
    festivos.push({ fecha: formatearISO(chiquinquira.anio, chiquinquira.mes, chiquinquira.dia), nombre: "Virgen de Chiquinquirá", tipo: "emiliani" });
  }

  // Asunción de la Virgen: 15 de agosto
  const asuncion = trasladarALunes(anio, 8, 15);
  festivos.push({ fecha: formatearISO(asuncion.anio, asuncion.mes, asuncion.dia), nombre: "Asunción de la Virgen", tipo: "emiliani" });

  // Día de la Raza: 12 de octubre
  const raza = trasladarALunes(anio, 10, 12);
  festivos.push({ fecha: formatearISO(raza.anio, raza.mes, raza.dia), nombre: "Día de la Raza", tipo: "emiliani" });

  // Todos los Santos: 1 de noviembre
  const todosSantos = trasladarALunes(anio, 11, 1);
  festivos.push({ fecha: formatearISO(todosSantos.anio, todosSantos.mes, todosSantos.dia), nombre: "Día de Todos los Santos", tipo: "emiliani" });

  // Independencia de Cartagena: 11 de noviembre
  const cartagena = trasladarALunes(anio, 11, 11);
  festivos.push({ fecha: formatearISO(cartagena.anio, cartagena.mes, cartagena.dia), nombre: "Independencia de Cartagena", tipo: "emiliani" });

  // Ordenar cronológicamente
  festivos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return festivos;
}

// Festivos de otros países (versión simplificada para comparativa)
function generarFestivosEcuador(anio) {
  const pascua = calcularPascua(anio);
  const carnaval1 = sumarDias(anio, pascua.mes, pascua.dia, -48);
  const carnaval2 = sumarDias(anio, pascua.mes, pascua.dia, -47);
  const viernes = sumarDias(anio, pascua.mes, pascua.dia, -2);
  return [
    { fecha: formatearISO(anio, 1, 1), nombre: "Año Nuevo", tipo: "fija" },
    { fecha: formatearISO(carnaval1.anio, carnaval1.mes, carnaval1.dia), nombre: "Carnaval", tipo: "fija" },
    { fecha: formatearISO(carnaval2.anio, carnaval2.mes, carnaval2.dia), nombre: "Carnaval", tipo: "fija" },
    { fecha: formatearISO(viernes.anio, viernes.mes, viernes.dia), nombre: "Viernes Santo", tipo: "fija" },
    { fecha: formatearISO(anio, 5, 1), nombre: "Día del Trabajo", tipo: "fija" },
    { fecha: formatearISO(anio, 5, 24), nombre: "Batalla de Pichincha", tipo: "fija" },
    { fecha: formatearISO(anio, 8, 10), nombre: "Primer Grito de Independencia", tipo: "fija" },
    { fecha: formatearISO(anio, 10, 9), nombre: "Independencia de Guayaquil", tipo: "fija" },
    { fecha: formatearISO(anio, 11, 2), nombre: "Día de los Difuntos", tipo: "fija" },
    { fecha: formatearISO(anio, 11, 3), nombre: "Independencia de Cuenca", tipo: "fija" },
    { fecha: formatearISO(anio, 12, 25), nombre: "Navidad", tipo: "fija" },
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function generarFestivosPeru(anio) {
  const pascua = calcularPascua(anio);
  const jueves = sumarDias(anio, pascua.mes, pascua.dia, -3);
  const viernes = sumarDias(anio, pascua.mes, pascua.dia, -2);
  return [
    { fecha: formatearISO(anio, 1, 1), nombre: "Año Nuevo", tipo: "fija" },
    { fecha: formatearISO(jueves.anio, jueves.mes, jueves.dia), nombre: "Jueves Santo", tipo: "fija" },
    { fecha: formatearISO(viernes.anio, viernes.mes, viernes.dia), nombre: "Viernes Santo", tipo: "fija" },
    { fecha: formatearISO(anio, 5, 1), nombre: "Día del Trabajo", tipo: "fija" },
    { fecha: formatearISO(anio, 6, 29), nombre: "San Pedro y San Pablo", tipo: "fija" },
    { fecha: formatearISO(anio, 7, 28), nombre: "Fiestas Patrias", tipo: "fija" },
    { fecha: formatearISO(anio, 7, 29), nombre: "Fiestas Patrias", tipo: "fija" },
    { fecha: formatearISO(anio, 8, 30), nombre: "Santa Rosa de Lima", tipo: "fija" },
    { fecha: formatearISO(anio, 10, 8), nombre: "Combate de Angamos", tipo: "fija" },
    { fecha: formatearISO(anio, 11, 1), nombre: "Todos los Santos", tipo: "fija" },
    { fecha: formatearISO(anio, 12, 8), nombre: "Inmaculada Concepción", tipo: "fija" },
    { fecha: formatearISO(anio, 12, 25), nombre: "Navidad", tipo: "fija" },
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function generarFestivosMexico(anio) {
  return [
    { fecha: formatearISO(anio, 1, 1), nombre: "Año Nuevo", tipo: "fija" },
    { fecha: formatearISO(anio, 2, 2), nombre: "Día de la Constitución", tipo: "emiliani" },
    { fecha: formatearISO(anio, 3, 16), nombre: "Natalicio de Benito Juárez", tipo: "emiliani" },
    { fecha: formatearISO(anio, 5, 1), nombre: "Día del Trabajo", tipo: "fija" },
    { fecha: formatearISO(anio, 9, 16), nombre: "Día de la Independencia", tipo: "fija" },
    { fecha: formatearISO(anio, 11, 16), nombre: "Día de la Revolución", tipo: "emiliani" },
    { fecha: formatearISO(anio, 12, 25), nombre: "Navidad", tipo: "fija" },
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function generarFestivosEspana(anio) {
  const pascua = calcularPascua(anio);
  const jueves = sumarDias(anio, pascua.mes, pascua.dia, -3);
  const viernes = sumarDias(anio, pascua.mes, pascua.dia, -2);
  return [
    { fecha: formatearISO(anio, 1, 1), nombre: "Año Nuevo", tipo: "fija" },
    { fecha: formatearISO(anio, 1, 6), nombre: "Día de Reyes", tipo: "fija" },
    { fecha: formatearISO(jueves.anio, jueves.mes, jueves.dia), nombre: "Jueves Santo", tipo: "fija" },
    { fecha: formatearISO(viernes.anio, viernes.mes, viernes.dia), nombre: "Viernes Santo", tipo: "fija" },
    { fecha: formatearISO(anio, 5, 1), nombre: "Día del Trabajo", tipo: "fija" },
    { fecha: formatearISO(anio, 8, 15), nombre: "Asunción de la Virgen", tipo: "fija" },
    { fecha: formatearISO(anio, 10, 12), nombre: "Fiesta Nacional de España", tipo: "fija" },
    { fecha: formatearISO(anio, 11, 1), nombre: "Día de Todos los Santos", tipo: "fija" },
    { fecha: formatearISO(anio, 12, 6), nombre: "Día de la Constitución", tipo: "fija" },
    { fecha: formatearISO(anio, 12, 8), nombre: "Inmaculada Concepción", tipo: "fija" },
    { fecha: formatearISO(anio, 12, 25), nombre: "Navidad", tipo: "fija" },
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

const PAISES = {
  co: { nombre: "Colombia", bandera: "CO", generar: generarFestivosColombia },
  ec: { nombre: "Ecuador", bandera: "EC", generar: generarFestivosEcuador },
  pe: { nombre: "Perú", bandera: "PE", generar: generarFestivosPeru },
  mx: { nombre: "México", bandera: "MX", generar: generarFestivosMexico },
  es: { nombre: "España", bandera: "ES", generar: generarFestivosEspana },
};

function obtenerFestivos(pais, anio) {
  const generador = PAISES[pais];
  if (!generador) return [];
  return generador.generar(anio);
}