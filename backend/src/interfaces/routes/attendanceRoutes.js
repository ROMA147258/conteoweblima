const express = require('express');
const router = express.Router();

function createAttendanceRoutes(attendanceController) {
  router.get('/', (req, res, next) => attendanceController.getAttendance(req, res, next));
  return router;
}

module.exports = createAttendanceRoutes;
