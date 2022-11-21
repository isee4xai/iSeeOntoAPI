const express = require('express');
const router = express.Router()
const queryctrl = require('../controllers/queries');

//----------------------------------------------------
// Onto Query Related Endpoints
//---------------------------------------------------

// Get one
router.get('/AITask', queryctrl.getAITasks); 
router.get('/AIMethod', queryctrl.getAIMethods);
router.get('/DataType', queryctrl.getDataTypes);
router.get('/AIModelAssessmentMetric', queryctrl.getAIModelAssessmentMetric);
router.get('/AIModelAssessmentDimension', queryctrl.getAIModelAssessmentDimension);
router.get('/Portability', queryctrl.getPortability);
router.get('/ExplainerConcurrentness', queryctrl.getExplainerConcurrentness);
// router.get('/hasPresentation', queryctrl.hasPresentation);
router.get('/ExplanationScope', queryctrl.getExplanationScope);
router.get('/ExplanationTarget', queryctrl.getExplanationTarget);
router.get('/UserQuestionTarget', queryctrl.getUserQuestionTarget);
router.get('/UserIntent', queryctrl.getUserIntent);
router.get('/UserDomain', queryctrl.getUserDomain);
router.get('/KnowledgeLevel', queryctrl.getKnowledgeLevel);
// router.get('/TechnicalFacilities', queryctrl.getTechnicalFacilities);


// Cockpit Required APIs
router.get('/cockpit/Usecases', queryctrl.getCockpitUsecases);


// ADMIN ONLY APIs
// Dump the existing ontology
router.post('/dump', queryctrl.dump);
router.post('/anyQueryAdmin', queryctrl.anyQueryAdmin);

module.exports = router;
