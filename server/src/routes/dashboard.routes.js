const router = require('express').Router();
const c = require('../controllers/dashboard.controller');
const validate = require('../middleware/validate');
const { dashboardQuery } = require('../validators/schemas');

router.get('/stats', validate({ query: dashboardQuery }), c.stats);

module.exports = router;
