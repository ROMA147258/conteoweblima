const express = require('express');

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

  // Registro de rutas API
  router.use('/auth', createAuthRoutes(authController));
  router.use('/results', createResultsRoutes(resultsController));
  router.use('/map', createMapRoutes(mapController));
  router.use('/comparison', createComparisonRoutes(comparisonController));
  router.use('/coordinators', createCoordinatorsRoutes(coordinatorsController));
  router.use('/attendance', createAttendanceRoutes(attendanceController));
  router.use('/health', createHealthRoutes(healthController));

  // Compatibilidad con endpoint legacy si se necesitara
  router.all('/voto-real', (req, res, next) => resultsController.getResults(req, res, next));

  return router;
}

module.exports = createApiRouter;
