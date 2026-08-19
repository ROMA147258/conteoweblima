const express = require('express');
const router = express.Router();

function createMapRoutes(mapController) {
  router.get('/', (req, res, next) => mapController.getMapData(req, res, next));
  return router;
}

module.exports = createMapRoutes;
