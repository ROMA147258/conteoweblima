const express = require('express');
const router = express.Router();

function createHealthRoutes(healthController) {
  router.get('/', (req, res, next) => healthController.check(req, res, next));
  return router;
}

module.exports = createHealthRoutes;
