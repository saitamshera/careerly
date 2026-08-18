const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { getReadiness, updateTarget } = require('../controllers/readiness.controller');

const router = express.Router();

router.use(protect);

router.get('/', getReadiness);
router.post('/target', updateTarget);

module.exports = router;
