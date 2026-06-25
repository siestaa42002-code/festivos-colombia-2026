# Festivos Colombia 2026

Calendario interactivo con los 19 festivos oficiales de Colombia para el año 2026, contador en vivo del próximo festivo y filtros por tipo (Ley Emiliani o fecha fija).

## Stack

HTML, CSS y JavaScript puro. Sin dependencias, sin build, sin frameworks.

## Estructura

```
festivos-colombia-2026/
├── index.html
├── styles.css
├── script.js
├── netlify.toml
├── .gitignore
└── README.md
```

## Correr en local

Abrir `index.html` directamente en el navegador, o servir la carpeta con cualquier servidor estático. Si tienes la extensión Live Server de VS Code, basta con clic derecho sobre `index.html` y elegir Open with Live Server.

## Subir a GitHub

Desde la carpeta del proyecto en la terminal:

```bash
git init
git add .
git commit -m "Primer commit: calendario de festivos Colombia 2026"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/festivos-colombia-2026.git
git push -u origin main
```

Reemplaza `TU_USUARIO` por tu usuario de GitHub. Antes debes crear el repositorio vacío desde la web de GitHub (sin README, sin gitignore, sin licencia, para evitar conflictos en el primer push).

## Desplegar en Netlify

Opción A, conectando el repo de GitHub (recomendada):

1. Entra a https://app.netlify.com y haz login con GitHub.
2. Add new site → Import an existing project → GitHub.
3. Selecciona el repositorio `festivos-colombia-2026`.
4. Build command: deja vacío. Publish directory: `.` (un punto).
5. Deploy site.

Cada vez que hagas push a `main`, Netlify redesplegará automáticamente.

Opción B, arrastrando la carpeta:

1. Entra a https://app.netlify.com.
2. Arrastra la carpeta del proyecto a la zona de "drag and drop".
3. Listo. El sitio queda publicado en una URL aleatoria que puedes personalizar después.

## Datos

Los festivos están definidos en `script.js` dentro del array `FESTIVOS_2026`. Cada festivo tiene:

- `fecha`: en formato `YYYY-MM-DD`.
- `nombre`: el nombre oficial.
- `tipo`: `emiliani` si se trasladó al lunes por la Ley 51 de 1983, `fija` si se celebra en su fecha original.

Para 2027 basta con replicar el array con las fechas nuevas.

## Licencia

Uso libre.
