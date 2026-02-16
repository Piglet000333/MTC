const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { requireStudent } = require('../middleware/auth');

router.use(requireStudent);

// POST /api/payment/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    // PayMongo Secret Key from environment
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    
    if (!secretKey) {
        // Fallback for development if no key is present
        return res.status(503).json({ 
            error: 'PAYMONGO_SECRET_KEY is missing in backend configuration.',
            isConfigError: true
        });
    }

    const payload = {
      data: {
        attributes: {
          line_items: [
            {
              amount: parseInt(amount * 100), // Convert to centavos
              currency: 'PHP',
              description: description || 'Assessment Fee',
              name: description || 'Assessment Fee',
              quantity: 1
            }
          ],
          payment_method_types: ['gcash', 'grab_pay', 'paymaya'],
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          description: description || 'Assessment Fee',
          success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student?payment_status=success&ref=PM-{payment_intent_id}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student?payment_status=cancelled`
        }
      }
    };

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(secretKey).toString('base64')}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].detail);
    }

    res.json({ checkoutUrl: data.data.attributes.checkout_url });

  } catch (err) {
    console.error('Payment Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/create-qr
router.post('/create-qr', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) {
        return res.status(503).json({ error: 'PAYMONGO_SECRET_KEY is missing.', isConfigError: true });
    }

    // 1. Create Payment Intent
    const payload = {
      data: {
        attributes: {
          amount: parseInt(amount * 100),
          payment_method_allowed: ['qrph'],
          payment_method_options: {
            card: { request_three_d_secure: 'any' }
          },
          currency: 'PHP',
          description: description || 'Assessment Fee',
          capture_type: 'automatic'
        }
      }
    };

    const response = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(secretKey).toString('base64')}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.errors) throw new Error(data.errors[0].detail);

    const paymentIntent = data.data;
    
    // PayMongo sometimes returns the QR code in next_action immediately for 'qrph'
    // If not, we might need to attach a payment method, but typically for direct Intent creation with 'qrph', it might not.
    // However, based on docs, the cleanest way for dynamic QR is creating an intent.
    // Let's check if next_action exists.
    
    // Actually, for QR Ph, we usually need to creating a Payment Method first is NOT required if using the Checkout API, 
    // but here we are using Payment Intent API.
    // WAIT: The search result showed "payment_method_allowed: ['qrph']" in Payment Intent returns "next_action: { type: 'consume_qr', ... }"
    // BUT only if the payment method is ATTACHED?
    // Let's try to just return the Payment Intent ID to the frontend, and the frontend might need to do something?
    // No, we want to return the QR Image URL.
    
    // If next_action is present, return it.
    if (paymentIntent.attributes.next_action && paymentIntent.attributes.next_action.type === 'consume_qr') {
        return res.json({
            paymentIntentId: paymentIntent.id,
            qrImageUrl: paymentIntent.attributes.next_action.code.image_url,
            qrUrl: paymentIntent.attributes.next_action.code.url // Some wallets support deep link
        });
    }

    // If no QR code yet, we might need to "attach" a generic QR Ph method?
    // Actually, simply creating the intent with `payment_method_allowed: ['qrph']` 
    // DOES NOT automatically generate the QR. It just says "this intent allows QR".
    // We usually need to Create a Payment Method (type: qrph) and then Attach it to the Intent.
    
    // 2. Create Payment Method (QR Ph)
    const pmPayload = { data: { attributes: { type: 'qrph' } } };
    const pmRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${Buffer.from(secretKey).toString('base64')}` },
        body: JSON.stringify(pmPayload)
    });
    const pmData = await pmRes.json();
    if (pmData.errors) throw new Error(pmData.errors[0].detail);
    const pmId = pmData.data.id;

    // 3. Attach Payment Method to Intent
    const attachPayload = {
        data: {
            attributes: {
                payment_method: pmId,
                return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student` // Not used for QR scan but required
            }
        }
    };
    
    const attachRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntent.id}/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${Buffer.from(secretKey).toString('base64')}` },
        body: JSON.stringify(attachPayload)
    });
    const attachData = await attachRes.json();
    if (attachData.errors) throw new Error(attachData.errors[0].detail);
    
    const attachedIntent = attachData.data;
    
    if (attachedIntent.attributes.next_action && attachedIntent.attributes.next_action.type === 'consume_qr') {
        return res.json({
            paymentIntentId: attachedIntent.id,
            qrImageUrl: attachedIntent.attributes.next_action.code.image_url
        });
    } else {
        throw new Error('Failed to generate QR code from PayMongo.');
    }

  } catch (err) {
    console.error('QR Gen Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/status/:id
router.get('/status/:id', async (req, res) => {
    try {
        const secretKey = process.env.PAYMONGO_SECRET_KEY;
        const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${req.params.id}`, {
            method: 'GET',
            headers: { 'Authorization': `Basic ${Buffer.from(secretKey).toString('base64')}` }
        });
        const data = await response.json();
        if (data.errors) throw new Error(data.errors[0].detail);
        
        // Status: 'succeeded', 'awaiting_payment_method', 'awaiting_next_action', 'processing'
        res.json({ 
            status: data.data.attributes.status,
            payments: data.data.attributes.payments 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
