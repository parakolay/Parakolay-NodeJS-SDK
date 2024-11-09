const express = require('express');
const Parakolay = require('./src/parakolay');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/init-payment', async (req, res) => {

    const parakolay = new Parakolay(
        process.env.API_BASE_URL,
        process.env.API_KEY,
        process.env.API_SECRET,
        process.env.MERCHANT_NUMBER,
        req.body.conversationID,
        req.ip
    );

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

    const parakolay = new Parakolay(
        process.env.API_BASE_URL,
        process.env.API_KEY,
        process.env.API_SECRET,
        process.env.MERCHANT_NUMBER,
        req.body.conversationID,
        req.ip
    );

    try {
        const {
            threeDSessionID,
            amount,
            installmentCount,
            cardHolderName,
            cardToken
        } = req.body;

        const result = await parakolay.complete3DS(
            threeDSessionID,
            amount,
            installmentCount,
            cardHolderName,
            cardToken
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

app.post('/reverse', async (req, res) => {

    try {
        const {
            conversationID,
            orderid,
        } = req.body;

        const parakolay = new Parakolay(
            process.env.API_BASE_URL,
            process.env.API_KEY,
            process.env.API_SECRET,
            process.env.MERCHANT_NUMBER,
            conversationID,
            req.ip
        );

        const result = await parakolay.reverse(
            orderid
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