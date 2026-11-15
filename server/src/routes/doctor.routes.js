const router = require('express').Router();
const c = require('../controllers/doctor.controller');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.get('/', validate({ query: s.doctorListQuery }), c.list);
router.post('/', validate({ body: s.doctorBody }), c.create);
router.get('/filters', c.filterOptions); // must stay above /:id
router.get('/options', c.options); // must stay above /:id

router.get('/:id', validate({ params: s.idParam }), c.getOne);
router.put('/:id', validate({ params: s.idParam, body: s.doctorUpdateBody }), c.update);
router.delete('/:id', validate({ params: s.idParam }), c.remove);

router.get('/:id/patients', validate({ params: s.idParam, query: s.doctorPatientsQuery }), c.listPatients);
router.post('/:id/patients', validate({ params: s.idParam, body: s.patientBody }), c.addPatient);
router.delete('/:id/patients/:patientId', validate({ params: s.doctorPatientParams }), c.removePatient);

module.exports = router;
