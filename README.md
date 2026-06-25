# Festivos Colombia

Calendario interactivo con festivos oficiales de Colombia, Ecuador, Perú, México y España, calculados algorítmicamente desde el Domingo de Resurrección (algoritmo de Meeus). Incluye vista de calendario con detección de puentes, sugerencias de vacaciones óptimas, calculadora de días hábiles, comparador entre países, API pública, modo offline (PWA) y descarga en formato iCal.

## Funcionalidades

- Vista de calendario mensual con popover al hover/tap
- Vista de lista con filtros (todos, trasladados, fecha fija, próximos, favoritos)
- Vista de herramientas con calculadora de días hábiles, sugeridor de vacaciones óptimas, comparador entre países, y consulta de API
- Próximo festivo con contador en vivo y detección automática de puentes
- Selector de año (2024 a 2030) y país (Colombia, Ecuador, Perú, México, España)
- Modo claro y oscuro
- Favoritos guardados en local
- Compartir festivo o sitio (Web Share API o portapapeles)
- Descarga del calendario completo en formato iCal (.ics) para Google Calendar, Apple Calendar y Outlook
- Animación de entrada en cascada de los meses al hacer scroll
- Confetti automático si entras al sitio durante un festivo
- Instalable como PWA con soporte offline
- Open Graph tags para previews bonitas al compartir
- API pública: `GET /api/festivos?pais=co&anio=2026`

## Estructura

```
festivos-colombia-2026/
├── index.html
├── styles.css
├── script.js               (lógica del frontend)
├── pascua.js               (cálculo de Pascua y festivos por país)
├── manifest.json           (PWA)
├── sw.js                   (service worker)
├── favicon.svg
├── og-image.svg            (preview para redes)
├── netlify/
│   └── functions/
│       └── festivos.js     (API serverless)
├── netlify.toml
├── .gitignore
└── README.md
```

## Stack

HTML, CSS y JavaScript puro. Sin dependencias, sin build step. La API se ejecuta como Netlify Function en Node.js.

## Correr en local

Abrir `index.html` con Live Server desde VS Code. El service worker y la API funcionan correctamente desde Netlify; en local la API requiere `netlify dev` (opcional).

Para probar la API en local con `netlify dev`:
```bash
npm install -g netlify-cli
netlify dev
```

## Despliegue

### GitHub

```bash
git add .
git commit -m "Mensaje del commit"
git push
```

### Netlify

Si ya conectaste el repo, Netlify redespliega automáticamente en cada push.

Configuración del sitio en Netlify (si lo conectas por primera vez):
- Build command: vacío
- Publish directory: `.`
- Functions directory: `netlify/functions` (lo detecta automáticamente desde el `netlify.toml`)

## API pública

Endpoint disponible en `/api/festivos`.

Parámetros:
- `pais`: código del país (`co`, `ec`, `pe`, `mx`, `es`). Por defecto `co`.
- `anio`: año (1900 a 2100). Por defecto el año actual.

Ejemplo:
```
GET /api/festivos?pais=co&anio=2026
```

Respuesta:
```json
{
  "pais": "Colombia",
  "codigo_pais": "co",
  "anio": 2026,
  "total": 19,
  "festivos": [
    { "fecha": "2026-01-01", "nombre": "Año Nuevo", "tipo": "fija" },
    ...
  ]
}
```

CORS abierto para cualquier origen.

## Datos

Los festivos se calculan en tiempo de ejecución a partir del año seleccionado. No hay tabla hardcodeada de fechas. Los festivos móviles (Jueves Santo, Viernes Santo, Ascensión, Corpus Christi, Sagrado Corazón) se derivan algorítmicamente desde el Domingo de Resurrección.

## Licencia

Uso libre.