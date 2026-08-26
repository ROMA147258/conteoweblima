# Voto Real Lima — Plataforma Electoral Profesional

Sistema integral y modular para la visualización, análisis y administración del conteo electoral en Lima (Elecciones 2026), desarrollado con **Clean Architecture** en Backend y **React + Vite** en Frontend, conectado directamente a **Microsoft SQL Server 2022**.

---

## 🏛️ Arquitectura del Sistema

```
conteovotosweblima/
├── backend/
│   ├── src/
│   │   ├── domain/              # Entidades y contratos
│   │   ├── application/         # Casos de uso (Lógica de Negocio)
│   │   ├── infrastructure/      # SQL Server (mssql), Repositorios, Servicios
│   │   ├── interfaces/          # Controladores, Rutas REST y Middlewares
│   │   ├── config/              # Variables de entorno
│   │   └── server.js            # Servidor Express (Puerto 5182)
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Sidebar, TopBar, FilterPanel
│   │   ├── features/            # Auth, Results, Map, Comparison, Coordinators, Attendance
│   │   ├── layouts/             # MainLayout
│   │   ├── context/             # AuthContext, ThemeContext, FilterContext
│   │   ├── services/            # apiClient y feature services
│   │   ├── styles/              # CSS Tokens, variables y diseño 1:1
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js           # Vite Server (Puerto 5174)
│
├── images/                      # Referencias visuales originales 1:1
├── INICIAR.bat                  # Script de arranque integral
├── COMPARTIR.bat                # Enlace público vía Cloudflare Tunnel
└── README.md
```

---

## 📊 Módulos Principales (Fidelidad 1:1 con `images/`)

1. **Login de Administrador (`images/1.png`)**: Acceso seguro con validación de credenciales y selector de modo claro/oscuro.
2. **Dashboard de Resultados (`images/2.png`)**: Visualización en tiempo real de conteo Manual vs. Imagen/OCR para Alcaldía Metropolitana y Distrital.
3. **Mapa Electoral Interactivo (`images/3.png`)**: Geolocalización en Leaflet de los 1,985 colegios y avance de escrutinio con capas oscura, clara, calle y satélite.
4. **Panel de Comparación Avanzada (`images/4.png`)**: Comparativa multivariable Lado A vs Lado B (Distritos, Colegios, Votos Provinciales vs Distritales).
5. **Monitoreo de Coordinadores (`images/5.png`)**: Control de apertura de mesas, avance por coordinador y estadísticas globales.
6. **Monitoreo de Personeros / Asistencia (`images/6.png`)**: Control de 1ª y 2ª confirmación sincronizado con la base de datos `conteo`.

---

## 🚀 Inicio Rápido

### Opción 1: Mediante Script Automático
Haz doble clic sobre **`INICIAR.bat`** para arrancar el backend en el puerto `5182` y el frontend en el puerto `5174`.

### Opción 2: Ejecución Manual
```bash
# 1. Iniciar Backend
cd backend
npm install
npm start

# 2. Iniciar Frontend
cd ../frontend
npm install
npm run dev
```

* **Frontend:** [http://localhost:5174](http://localhost:5174)
* **Backend API:** [http://localhost:5182/api](http://localhost:5182/api)
* **Credenciales Admin:** Usuario: `admin` | Clave: `admin2024`
