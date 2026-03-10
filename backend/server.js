// server.js

const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ====== Safaricom Daraja (STK Push) ======
app.post('/api/mpesa/stkpush', async (req, res) => {
  const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

  try {
    // Get OAuth Token
    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        auth: {
          username: process.env.DARAJA_CONSUMER_KEY,
          password: process.env.DARAJA_CONSUMER_SECRET
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Generate password
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const password = Buffer.from(
      process.env.DARAJA_SHORTCODE + process.env.DARAJA_PASSKEY + timestamp
    ).toString('base64');

    // STK Push request
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.DARAJA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: process.env.DARAJA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: `${process.env.BACKEND_URL}/api/mpesa/callback`,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json({ success: true, response: stkResponse.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====== Daraja Callback ======
app.post('/api/mpesa/callback', (req, res) => {
  console.log('Daraja Callback:', req.body);
  res.status(200).send('Received');
});

// ====== Stripe Payment ======
app.post('/api/stripe/charge', async (req, res) => {
  const { amount, currency, streamerId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency,
      metadata: { streamerId }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ====== Payout Routes Integration ======
const payoutRoutes = require('./payoutRoutes');
app.use('/api', payoutRoutes);

app.listen(3000, () => {
  console.log('Backend running on port 3000');
});
