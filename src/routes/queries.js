const express = require('express');
const router = express.Router()
const queryctrl = require('../controllers/queries');

//----------------------------------------------------
// Onto Query Related Endpoints
//---------------------------------------------------

// Get one
router.get('/AITask', queryctrl.getAITasks); 
router.get('/AIMethod', queryctrl.getAIMethods);
router.get('/KnowledgeLevel', queryctrl.getKnowledgeLevel);

module.exports = router;