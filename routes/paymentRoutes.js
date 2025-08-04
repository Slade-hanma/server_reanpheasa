// const express = require('express');
// const router = express.Router();
// const paypalService = require('../controllers/paypalController');

// // Route to create PayPal order
// router.post('/create-order', async (req, res) => {
//   try {
//     const items = req.body.items;
//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ error: 'Items array is required' });
//     }

//     const approveUrl = await paypalService.createOrder(items);
//     res.json({ approveUrl });
//   } catch (error) {
//     console.error('Error creating PayPal order:', error);
//     res.status(500).json({ error: 'Failed to create PayPal order' });
//   }
// });

// // Route to capture payment after approval
// router.post('/capture-payment/:orderId', async (req, res) => {
//   try {
//     const orderId = req.params.orderId;
//     if (!orderId) {
//       return res.status(400).json({ error: 'Order ID is required' });
//     }
//     const captureResult = await paypalService.capturePayment(orderId);
//     res.json(captureResult);
//   } catch (error) {
//     console.error('Error capturing PayPal payment:', error);
//     res.status(500).json({ error: 'Failed to capture PayPal payment' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const paypalService = require('../controllers/paypalController');

// Here just directly forward the controller as route handler
router.post('/create-order', paypalService.createOrder);

router.post('/capture-payment/:orderId', paypalService.capturePayment);

module.exports = router;
