const express = require('express');
const router = express.Router();

function createComparisonRoutes(comparisonController) {
  router.get('/', (req, res, next) => comparisonController.getComparison(req, res, next));
  return router;
}

module.exports = createComparisonRoutes;
