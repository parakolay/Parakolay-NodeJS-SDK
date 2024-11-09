const express = require('express');
const Parakolay = require('./src/parakolay');
require('dotenv').config();

const app = express();
app.use(express.json());

const parakolay = new Parakolay(
    process.env.API_BASE_URL || 'https://api.example.com',
    process.env.API_KEY || '',
    process.env.API_SECRET || '',
    process.env.MERCHANT_NUMBER || '',
    'CONVERSATION-ID', // You might want to generate this dynamically
    '127.0.0.1'
);

app.post('/init-payment', async (req, res) => {
    try {
        const {
            cardNumber,
            cardholderName,
            expireMonth,
            expireYear,
            cvc,
            amount,
            pointAmount,
            installmentCount,
            callbackURL
        } = req.body;

        const result = await parakolay.init3DS(
            cardNumber,
            cardholderName,
            expireMonth,
            expireYear,
            cvc,
            amount,
            pointAmount,
            installmentCount,
            callbackURL
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

app.post('/complete-payment', async (req, res) => {
    try {
        const {
            threeDSessionID,
            amount,
            installmentCount,
            cardHolderName,
            cardToken,
            currency
        } = req.body;

        const result = await parakolay.complete3DS(
            threeDSessionID,
            amount,
            installmentCount,
            cardHolderName,
            cardToken,
            currency
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});