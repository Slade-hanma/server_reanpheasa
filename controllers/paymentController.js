const paypal = require('paypal-rest-sdk');

// Configure PayPal SDK
paypal.configure({
  mode: 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

exports.createPayment = (req, res) => {
  const { courseId, userId, price, courseName } = req.body;

  if (!courseId || !userId || !price || !courseName) {
    return res.status(400).json({ error: 'Missing required payment fields' });
  }

  const payment = {
    intent: 'sale',
    payer: { payment_method: 'paypal' },
    redirect_urls: {
      return_url: `http://localhost:5173/paypal?courseId=${courseId}&userId=${userId}`,
      cancel_url: 'http://localhost:5173/cancel',
    },
    transactions: [
      {
        amount: {
          currency: 'USD',
          total: price.toString(),
        },
        description: `Payment for ${courseName}`,
      },
    ],
  };

  paypal.payment.create(payment, (err, payment) => {
    if (err) {
      console.error('PayPal create error:', err.response || err);
      return res.status(500).json({ error: 'PayPal create failed' });
    }

    const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
    res.json({ approvalUrl: approvalUrl.href });
  });
};

exports.success = (req, res) => {
  res.send('Payment Success');
};

exports.cancel = (req, res) => {
  res.send('Payment Cancelled');
};

exports.executePayment = (req, res) => {
  const { paymentId, payerId } = req.body;

  const execute_payment_json = {
    payer_id: payerId,
  };

  paypal.payment.execute(paymentId, execute_payment_json, (err, payment) => {
    if (err) {
      console.error('Execute error:', err.response || err);
      return res.status(500).json({ success: false, error: 'Execute failed' });
    }

    res.json({ success: true, payment });
  });
};