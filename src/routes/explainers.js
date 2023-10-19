const express = require('express');
const router = express.Router()
const explainersctrl = require('../controllers/explainers');

// ADMIN ONLY APIs
// Dump the existing ontology
router.post('/dump_explainers', explainersctrl.dumpExplainers);
router.post('/insert', explainersctrl.insertExplainer); // adding a new explainer into the ontology
router.get('/list', explainersctrl.list);
router.post('/anyUpdateAdmin', explainersctrl.anyUpdateAdmin);

module.exports = router;
