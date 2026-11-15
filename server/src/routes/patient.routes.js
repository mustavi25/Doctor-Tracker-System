const router = require('express').Router();
const c = require('../controllers/patient.controller');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.get('/', validate({ query: s.patientListQuery }), c.list);
router.get('/conditions', c.conditions); // must stay above /:id

router.get('/:id', validate({ params: s.idParam }), c.getOne);
router.put('/:id', validate({ params: s.idParam, body: s.patientUpdateBody }), c.update);
router.delete('/:id', validate({ params: s.idParam }), c.remove);

module.exports = router;
