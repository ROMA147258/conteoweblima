const express = require('express');
const router = express.Router();

function createResultsRoutes(resultsController) {
  router.get('/', (req, res, next) => resultsController.getResults(req, res, next));
  return router;
}

module.exports = createResultsRoutes;
