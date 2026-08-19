const express = require('express');
const router = express.Router();

function createAuthRoutes(authController) {
  router.post('/login', (req, res, next) => authController.login(req, res, next));
  router.post('/logout', (req, res, next) => authController.logout(req, res, next));
  return router;
}

module.exports = createAuthRoutes;
