const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createDsaProblemSchema, updateDsaProblemSchema } = require('../schemas/dsa.schema');
const {
  getDsaProblemsHandler,
  getDsaProblemByIdHandler,
  createDsaProblemHandler,
  updateDsaProblemHandler,
  deleteDsaProblemHandler,
  getDsaStatsHandler,
  getTodayProblemsHandler,
  getStreakHandler
} = require('../controllers/dsa.controller');

const dsaRoutes = express.Router();

dsaRoutes.use(protect);

dsaRoutes.get('/', getDsaProblemsHandler);
dsaRoutes.get('/stats', getDsaStatsHandler);
dsaRoutes.get('/today', getTodayProblemsHandler);
dsaRoutes.get('/streak', getStreakHandler);
dsaRoutes.get('/:id', getDsaProblemByIdHandler);
dsaRoutes.post('/', validate(createDsaProblemSchema), createDsaProblemHandler);
dsaRoutes.put('/:id', validate(updateDsaProblemSchema), updateDsaProblemHandler);
dsaRoutes.delete('/:id', deleteDsaProblemHandler);

module.exports = { dsaRoutes };