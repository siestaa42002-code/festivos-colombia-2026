# Festivos

Calendario de días festivos con eventos personales y recordatorios. Instalable como app en el teléfono.

## Qué hace

**Calendario** — vista anual de 12 meses. Al abrir se sitúa en el mes actual. Los festivos salen en azul y tus eventos con el color de su categoría. Toca cualquier día para ver qué hay o añadir algo.

**Agenda** — festivos y eventos próximos mezclados y en orden, para ver de un vistazo lo que viene.

**Mis eventos** — cumpleaños, pagos, citas, viajes y lo que quieras recordar. Siete categorías con color, eventos de un día o de varios, con hora o de jornada completa, opción de repetir cada año y recordatorio al detalle.

**Puentes** — festivos que caen lunes o viernes.

**Vacaciones óptimas** — calcula dónde conviene pedir días libres. Ordena por rendimiento: cuántos días de descanso ganas por cada día que pides.

**Días hábiles** — cuenta días laborales entre dos fechas descontando festivos y fines de semana.

**Comparar** — festivos y puentes de Colombia, México, España, Perú y Ecuador.

**Ajustes** — permisos de notificación, copia de seguridad y exportación.

## Características

- Cálculo algorítmico de Pascua (Meeus/Jones/Butcher) para los festivos móviles.
- Ley Emiliani aplicada correctamente: traslado al lunes siguiente cuando corresponde.
- Zona horaria fija en Bogotá (UTC-5), sin importar dónde esté el dispositivo.
- Años 2024 a 2030.
- Búsqueda que ignora tildes: escribe "ascension" y encuentra "Ascensión del Señor".
- Recordatorios con notificaciones del sistema.
- Exportación a archivo `.ics` compatible con Google Calendar, Apple Calendar y Outlook.
- Compartir con el menú nativo del teléfono, o copiado al portapapeles si no está disponible.
- Copia de seguridad en JSON: descarga y restaura tus eventos.
- Modo claro y oscuro.
- PWA instalable en Android e iOS. Funciona sin conexión.
- Todo se guarda solo en tu dispositivo. No hay servidor ni cuentas.

## Eventos de varios días y con hora

Un evento puede durar un solo día o extenderse por un rango. En el calendario el rango se pinta como una banda continua, y si un festivo cae dentro conserva su color pero mantiene la continuidad.

Marcando "Todo el día" el evento ocupa la jornada completa. Si lo desmarcas puedes poner hora de inicio y, en los eventos de varios días, también hora de fin.

## Recordatorios al detalle

El recordatorio se arma con cinco ruedas: meses, semanas, días, horas y minutos. Se combinan entre sí, así que puedes pedir un aviso "1 semana y 3 días antes" o "2 horas y 30 minutos antes". Hay atajos para los casos más comunes.

El cálculo tiene precisión de minutos y usa la hora de Bogotá. Un evento a las 09:00 con aviso de 2 horas avisa a las 07:00, no antes.

Al exportar a tu calendario, los recordatorios se convierten en alarmas nativas con la duración exacta.

## Eventos que se repiten

Un evento marcado como anual se proyecta a cualquier año que consultes. Si pones un cumpleaños con la fecha de nacimiento, la app calcula la edad automáticamente. Los eventos del 29 de febrero se muestran el 28 en los años no bisiestos, y lo mismo ocurre con el 31 en meses de 30 días.

## Instalar en el teléfono

**Android (Chrome):** abre el sitio y toca Instalar en el banner, o usa el menú de tres puntos y elige "Instalar aplicación".

**iPhone (Safari):** toca Compartir y luego "Añadir a pantalla de inicio".

## Stack

HTML, CSS y JavaScript puro. Sin frameworks ni dependencias. Tipografía Geist.

## Archivos

```
festivos-data.js   cálculo de festivos y utilidades de fecha
eventos.js         eventos personales, recordatorios, ICS, copia de seguridad
script.js          interfaz y navegación
styles.css         estilos
index.html         estructura
sw.js              service worker para funcionamiento sin conexión
```

## Licencia

MIT
