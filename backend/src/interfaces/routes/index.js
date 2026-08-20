const express = require('express');
const path = require('path');
const fs = require('fs');

// Repositorios
const SqlUserRepository = require('../../infrastructure/repositories/SqlUserRepository');
const SqlVotesRepository = require('../../infrastructure/repositories/SqlVotesRepository');
const SqlSchoolsRepository = require('../../infrastructure/repositories/SqlSchoolsRepository');
const SqlCoordinatorsRepository = require('../../infrastructure/repositories/SqlCoordinatorsRepository');
const SqlAttendanceRepository = require('../../infrastructure/repositories/SqlAttendanceRepository');

// Casos de Uso
const LoginUseCase = require('../../application/use-cases/LoginUseCase');
const GetResultsUseCase = require('../../application/use-cases/GetResultsUseCase');
const GetMapDataUseCase = require('../../application/use-cases/GetMapDataUseCase');
const GetComparisonUseCase = require('../../application/use-cases/GetComparisonUseCase');
const GetCoordinatorsUseCase = require('../../application/use-cases/GetCoordinatorsUseCase');
const GetAttendanceUseCase = require('../../application/use-cases/GetAttendanceUseCase');
const HealthCheckUseCase = require('../../application/use-cases/HealthCheckUseCase');

// Controladores
const AuthController = require('../controllers/AuthController');
const ResultsController = require('../controllers/ResultsController');
const MapController = require('../controllers/MapController');
const ComparisonController = require('../controllers/ComparisonController');
const CoordinatorsController = require('../controllers/CoordinatorsController');
const AttendanceController = require('../controllers/AttendanceController');
const HealthController = require('../controllers/HealthController');

// Builders de Rutas
const createAuthRoutes = require('./authRoutes');
const createResultsRoutes = require('./resultsRoutes');
const createMapRoutes = require('./mapRoutes');
const createComparisonRoutes = require('./comparisonRoutes');
const createCoordinatorsRoutes = require('./coordinatorsRoutes');
const createAttendanceRoutes = require('./attendanceRoutes');
const createHealthRoutes = require('./healthRoutes');

function createApiRouter() {
  const router = express.Router();

  // Inyección de dependencias
  const userRepo = new SqlUserRepository();
  const votesRepo = new SqlVotesRepository();
  const schoolsRepo = new SqlSchoolsRepository();
  const coordinatorsRepo = new SqlCoordinatorsRepository();
  const attendanceRepo = new SqlAttendanceRepository();

  const loginUseCase = new LoginUseCase(userRepo);
  const getResultsUseCase = new GetResultsUseCase(votesRepo);
  const getMapDataUseCase = new GetMapDataUseCase(schoolsRepo);
  const getComparisonUseCase = new GetComparisonUseCase(votesRepo);
  const getCoordinatorsUseCase = new GetCoordinatorsUseCase(coordinatorsRepo);
  const getAttendanceUseCase = new GetAttendanceUseCase(attendanceRepo);
  const healthCheckUseCase = new HealthCheckUseCase();

  const authController = new AuthController(loginUseCase);
  const resultsController = new ResultsController(getResultsUseCase);
  const mapController = new MapController(getMapDataUseCase);
  const comparisonController = new ComparisonController(getComparisonUseCase);
  const coordinatorsController = new CoordinatorsController(getCoordinatorsUseCase);
  const attendanceController = new AttendanceController(getAttendanceUseCase);
  const healthController = new HealthController(healthCheckUseCase);

  // ── Rutas API con arquitectura limpia ──
  router.use('/auth', createAuthRoutes(authController));
  router.use('/results', createResultsRoutes(resultsController));
  router.use('/map', createMapRoutes(mapController));
  router.use('/comparison', createComparisonRoutes(comparisonController));
  router.use('/coordinators', createCoordinatorsRoutes(coordinatorsController));
  router.use('/attendance', createAttendanceRoutes(attendanceController));
  router.use('/health', createHealthRoutes(healthController));

  // ── Alias /login → /auth/login (compatibilidad con web/) ──
  router.post('/login', (req, res, next) => authController.login(req, res, next));
  router.post('/logout', (req, res, next) => authController.logout(req, res, next));

  // ── Endpoint /config (GET + POST) — configura ajustes del sistema ──
  const configPath = path.join(__dirname, '../../../../../config.json');

  router.get('/config', (req, res) => {
    if (fs.existsSync(configPath)) {
      try {
        return res.json(JSON.parse(fs.readFileSync(configPath, 'utf8')));
      } catch (_) {}
    }
    res.json({ apiUrl: '/api/voto-real', theme: 'dark', dashboardLayout: [] });
  });

  router.post('/config', (req, res) => {
    try {
      fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error al guardar configuración: ' + err.message });
    }
  });

  // ── Handler legacy /voto-real con action= (compatibilidad total con web/) ──
  const handleVotoRealAction = async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const payload = Object.assign({}, req.query || {}, req.body || {});
    const action = payload.action || 'obtener_reporte';

    try {
      // Warmup check
      if (action === 'login') {
        const rawDni = (payload.dni || '').toString().trim();
        const rawNombre = (payload.nombre || '').toString().trim();
        if (rawDni === '__warmup__' || rawNombre === '__warmup__') {
          return res.json({ success: true, status: 'success', message: 'Warmup exitoso' });
        }
        // Redirigir al use case de login
        const user = await userRepo.findByDniOrName(rawDni, rawNombre);
        if (user) {
          return res.json({ success: true, status: 'success', usuario: user, user, data: user });
        }
        return res.json({ success: false, status: 'error', message: 'Usuario no encontrado.' });
      }

      if (action === 'registrar_votos') {
        const result = await votesRepo.registrarVotos(payload);
        return res.json(result);
      }

      if (action === 'registrar_asistencia') {
        const result = await attendanceRepo.registrarAsistencia(payload);
        return res.json(result);
      }

      if (action === 'confirmar_asistencia_llegada') {
        const result = await attendanceRepo.confirmarLlegada(payload);
        return res.json(result);
      }

      if (action === 'confirmar_coordinador') {
        const result = await coordinatorsRepo.confirmarCoordinador(payload);
        return res.json(result);
      }

      if (action === 'obtener_usuarios' || action === 'read') {
        const result = await votesRepo.getUsuarios();
        return res.json(result);
      }

      if (action === 'obtener_asistencia') {
        const data = await attendanceRepo.getAttendanceList();
        return res.json({ success: true, asistencia: data, data });
      }

      if (action === 'obtener_coordinadores') {
        const data = await coordinatorsRepo.getCoordinators();
        return res.json({ success: true, coordinadores: data, data });
      }

      if (action === 'obtener_asistencia_por_dni') {
        const dni = (payload.dni || '').toString().trim();
        if (!dni) return res.json({ success: false, message: 'Se requiere DNI' });
        const result = await votesRepo.getAsistenciaPorDni(dni);
        return res.json(result);
      }

      if (action === 'obtener_confirmaciones_por_colegio') {
        const colegio = (payload.colegio || '').toString().trim();
        if (!colegio) return res.json({ success: false, message: 'Se requiere colegio' });
        const result = await votesRepo.getConfirmacionesPorColegio(colegio);
        return res.json(result);
      }

      if (action === 'obtener_mesas') {
        const mesas = await votesRepo.getMesas();
        return res.json({ success: true, mesas });
      }

      if (action === 'obtener_reporte' || action === 'read_reporte') {
        const result = await votesRepo.getReporte();
        return res.json(result);
      }

      return res.json({ success: false, message: `Acción '${action}' no reconocida` });
    } catch (err) {
      console.error(`[API /voto-real] Error en action='${action}':`, err.message);
      return res.status(500).json({ success: false, message: 'Error en Base de Datos: ' + err.message });
    }
  };

  // ── Rutas legacy compatibles con server.js raíz ──
  router.all('/voto-real', handleVotoRealAction);
  router.all('/voto-real/', handleVotoRealAction);
  router.all('/sheets/sync', handleVotoRealAction);
  router.all('/sql', handleVotoRealAction);

  return router;
}

module.exports = createApiRouter;
