# Festivos

Calendario de días festivos con eventos personales y recordatorios. Instalable como app en el teléfono.

## Qué hace

**Calendario** — vista anual de 12 meses. Al abrir se sitúa en el mes actual. Los festivos salen en azul y tus eventos con el color de su categoría. Toca cualquier día para ver qué hay o añadir algo.

**Agenda** — festivos y eventos próximos mezclados y en orden, para ver de un vistazo lo que viene.

**Mis eventos** — cumpleaños, pagos, citas y lo que quieras recordar. Siete categorías con color, opción de repetir cada año y recordatorio configurable.

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

## Eventos que se repiten

Un evento marcado como anual se proyecta a cualquier año que consultes. Si pones un cumpleaños con la fecha de nacimiento, la app calcula la edad automáticamente. Los eventos del 29 de febrero se muestran el 28 en los años no bisiestos.

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
