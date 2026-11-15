const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginBody } = require('../validators/schemas');

router.post('/login', validate({ body: loginBody }), c.login);
router.post('/logout', c.logout);
router.get('/me', protect, c.me);

module.exports = router;
