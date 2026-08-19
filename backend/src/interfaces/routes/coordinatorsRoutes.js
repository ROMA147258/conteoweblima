const express = require('express');
const router = express.Router();

function createCoordinatorsRoutes(coordinatorsController) {
  router.get('/', (req, res, next) => coordinatorsController.getCoordinators(req, res, next));
  return router;
}

module.exports = createCoordinatorsRoutes;
