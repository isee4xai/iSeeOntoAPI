const express = require('express');
const router = express.Router()
const reusectrl = require('../controllers/reuse');

router.get('/ReuseSupport', reusectrl.reuseSupport);
router.get('/ExplainerFieldsFiltered', reusectrl.explainerFieldsFiltered);
router.get('/ExplainersExtended', reusectrl.explainersExtended);

module.exports = router;
