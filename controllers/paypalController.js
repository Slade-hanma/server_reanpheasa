const paypal = require('paypal-rest-sdk');

// Configure PayPal SDK
paypal.configure({
  mode: 'sandbox', // or 'live'
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

exports.renderHome = (req, res) => {
  res.render('index', { amount: 9.99 });
};

exports.createPayment = (req, res) => {
  const paymentJson = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: 'http://localhost:5000/success',
      cancel_url: 'http://localhost:5000/cancel'
    },
    transactions: [{
      item_list: {
        items: [{
          name: 'Online Course',
          sku: '001',
          price: '9.99',
          currency: 'USD',
          quantity: 1
        }]
      },
      amount: {
        currency: 'USD',
        total: '9.99'
      },
      description: 'Purchase of online course.'
    }]
  };

  paypal.payment.create(paymentJson, (err, payment) => {
    if (err) {
      console.error(err);
      res.send('Error creating payment');
    } else {
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
      res.redirect(approvalUrl);
    }
  });
};

exports.success = (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const executePaymentJson = {
    payer_id: payerId,
    transactions: [{
      amount: {
        currency: 'USD',
        total: '9.99'
      }
    }]
  };

  paypal.payment.execute(paymentId, executePaymentJson, (err, payment) => {
    if (err) {
      console.error(err.response);
      return res.send('Payment failed');
    } else {
      res.render('success', { payment });
    }
  });
};

exports.cancel = (req, res) => {
  res.send('Payment was cancelled');
};
