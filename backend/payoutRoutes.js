// payoutRoutes.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Use env key
const paypal = require('@paypal/payouts-sdk');
const admin = require('firebase-admin');

// ===== Stripe Connect Payout =====
router.post('/stripe/payout', async (req, res) => {
  try {
    const { streamerId, amount, currency = 'usd', stripeAccountId } = req.body;

    const payout = await stripe.payouts.create(
      {
        amount: amount * 100, // Stripe expects cents
        currency,
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    return res.json({ success: true, payout });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== PayPal Payout =====
router.post('/paypal/payout', async (req, res) => {
  try {
    const { streamerEmail, amount, currency = 'USD' } = req.body;

    // Configure PayPal SDK environment
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;
    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    const client = new paypal.core.PayPalHttpClient(environment);

    const request = new paypal.payouts.PayoutsPostRequest();
    request.requestBody({
      sender_batch_header: {
        sender_batch_id: `batch_${Date.now()}`,
        email_subject: "You have a payout!"
      },
      items: [{
        recipient_type: "EMAIL",
        amount: {
          value: amount.toString(),
          currency
        },
        receiver: streamerEmail,
        note: "Thanks for your amazing content!",
        sender_item_id: `item_${Date.now()}`
      }]
    });

    const response = await client.execute(request);
    res.json({ success: true, response: response.result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== M-Pesa Withdraw (Daraja) =====
router.post('/mpesa/withdraw', async (req, res) => {
  try {
    const { phoneNumber, amount, streamerId } = req.body;

    // Daraja B2C API
    const darajaUrl = 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest';
    const token = process.env.DARAJA_ACCESS_TOKEN;

    const response = await axios.post(darajaUrl, {
      InitiatorName: process.env.DARAJA_INITIATOR,
      SecurityCredential: process.env.DARAJA_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: process.env.DARAJA_SHORTCODE,
      PartyB: phoneNumber,
      Remarks: 'Streamer Withdrawal',
      QueueTimeOutURL: `${process.env.BACKEND_URL}/timeout`,
      ResultURL: `${process.env.BACKEND_URL}/result`
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Donation History API =====
router.get('/donations/:streamerId', async (req, res) => {
  try {
    const { streamerId } = req.params;
    const snapshot = await admin.database().ref(`liveDonations/${streamerId}`).once('value');
    const donations = snapshot.val() || {};
    res.json({ success: true, donations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Global Withdraw Endpoint (MTN, Airtel, GCash, Bank, PayPal, Stripe, M-Pesa) =====
router.post('/withdraw', async (req, res) => {
  const { streamerId, amount, method, phoneNumber, paypalEmail, stripeAccountId, country, bankAccount } = req.body;

  try {
    let result;

    switch (method) {
      case 'M-Pesa':
        // Call Daraja Payout API
        result = await axios.post(
          'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
          { phoneNumber, amount, streamerId },
          { headers: { Authorization: `Bearer ${process.env.DARAJA_ACCESS_TOKEN}` } }
        );
        break;

      case 'PayPal':
        // Call PayPal Payout
        result = await axios.post(
          'https://api.sandbox.paypal.com/v1/payments/payouts',
          {
            sender_batch_header: { sender_batch_id: streamerId },
            items: [{ recipient_type: 'EMAIL', amount: { value: amount, currency: 'USD' }, receiver: paypalEmail }]
          },
          { headers: { Authorization: `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}` } }
        );
        break;

      case 'Stripe':
        // Stripe Connect Payout
        result = await stripe.payouts.create(
          { amount: Math.round(amount * 100), currency: 'usd' },
          { stripeAccount: stripeAccountId }
        );
        break;

      case 'MTN':
      case 'Airtel':
      case 'GCash':
      case 'Bank':
        // Simulate local mobile banking payout per country
        console.log(`Simulated ${method} payout of ${amount} to ${country || 'UNKNOWN'}`);
        result = { success: true, message: `Simulated ${method} payout` };
        break;

      default:
        throw new Error('Unsupported withdrawal method');
    }

    res.json({ success: true, data: result.data || result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
