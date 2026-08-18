const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { getDashboard } = require('../controllers/dashboard.controller');

const dashboardRoutes = express.Router();

dashboardRoutes.get('/', protect, getDashboard);

module.exports = { dashboardRoutes };