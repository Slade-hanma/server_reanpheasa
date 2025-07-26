const express = require('express');
const router = express.Router();
const {
  createPayment,
  success,
  cancel,
  executePayment,
} = require('../controllers/paymentController');

router.post('/create-payment', createPayment);
router.get('/success', success);
router.get('/cancel', cancel);
router.post('/execute-payment', executePayment);

module.exports = router;
