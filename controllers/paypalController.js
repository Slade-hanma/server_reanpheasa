require('dotenv').config();

const axios= require('axios')

async function generateAccessToken(){
    const response = await axios({
        url: process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
        method: 'POST',
        data: 'grant_type=client_credentials',

        auth: {
            username: process.env.PAYPAL_CLIENT_ID,
            password: process.env.PAYPAL_SECRET
        },
    })
    // console.log(response.data)
    return response.data.access_token
}


function calculateTotal(items) {
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    const unitValue = parseFloat(item.unit_amount.value);
    return sum + (quantity * unitValue);
  }, 0).toFixed(2);
}

createOrder = async (req, res) => {
  try {
    console.log('Received body:', req.body);

    const { items } = req.body;
    const courseId = items[0].courseId; 
    console.log('Course ID from body:', courseId);

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required.' });
    }

    console.log('Generating PayPal token...');
    const accessToken = await generateAccessToken();
    console.log('Access token:', accessToken);

    const order = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items: items,
          amount: {
            currency_code: 'USD',
            value: calculateTotal(items),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: calculateTotal(items)
              }
            }
          }
        }
      ],
      application_context: {
          return_url: `http://localhost:5173/course-detail/${courseId}?status=success`,
          cancel_url: `http://localhost:5173/course-detail/${courseId}?status=cancelled`
      }
    };

    const response = await axios.post(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, order, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });

    console.log('PayPal order response:', response.data);
    res.status(201).json(response.data);

  } catch (error) {
    console.error('🔴 PayPal Order Error:', error.response?.data || error.message || error);
    res.status(500).json({ error: 'Something went wrong', details: error.response?.data || error.message });
  }
};


capturePayment = async(orderId) => {
    const accessToken= await generateAccessToken()
    const response = await axios({
        url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders/' + orderId + '/capture',
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
    })
    return response.data
}

module.exports = {
  createOrder,
  capturePayment,
};





// async function createOrder(items) {
//   if (!items || !Array.isArray(items)) {
//     throw new Error('Items array is required.');
//   }

//   const accessToken = await generateAccessToken();

//   const order = {
//     intent: 'CAPTURE',
//     purchase_units: [
//       {
//         items: items,
//         amount: {
//           currency_code: 'USD',
//           value: calculateTotal(items),
//           breakdown: {
//             item_total: {
//               currency_code: 'USD',
//               value: calculateTotal(items),
//             },
//           },
//         },
//       },
//     ],
//     application_context: {
//       return_url: 'http://localhost:3000/complete-order',
//       cancel_url: process.env.BASE_URL + '/cancel-order',
//     },
//   };

//   const response = await axios.post(
//     `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
//     order,
//     {
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//     }
//   );

//   return response.data;
// }