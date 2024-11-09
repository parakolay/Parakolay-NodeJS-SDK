const axios = require('axios');
const FormData = require('form-data');
const { Helpers } = require('./helpers');

class Parakolay {
    constructor(baseUrl, apiKey, apiSecret, merchantNumber, conversationId, clientIpAddress) {
        this.version = 'v1.0.0';
        this.apiKey = apiKey;
        this.merchantNumber = merchantNumber;
        this.conversationId = conversationId;
        this.clientIpAddress = clientIpAddress;
        this.currency = 'TRY';

        this.nonce = Helpers.getMilliseconds();
        this.signature = Helpers.generateSignature(apiKey, apiSecret, this.nonce, conversationId);

        this.multipartClient = axios.create({
            baseURL: baseUrl,
            headers: {
                'User-Agent': `Parakolay Node.js SDK ${this.version}`
            }
        });

        this.jsonClient = axios.create({
            baseURL: baseUrl,
            headers: {
                'User-Agent': `Parakolay Node.js SDK ${this.version}`,
                'publicKey': apiKey,
                'nonce': this.nonce.toString(),
                'signature': this.signature,
                'conversationId': conversationId,
                'clientIpAddress': clientIpAddress,
                'merchantNumber': merchantNumber,
                'Content-Type': 'application/json'
            }
        });
    }

    async init3DS(cardNumber, cardholderName, expireMonth, expireYear, cvc, amount, pointAmount, installmentCount, callbackURL, currency = 'TRY', languageCode = 'TR') {
        this.cardholderName = cardholderName;
        this.cardToken = await this.getCardToken(cardNumber, cardholderName, expireMonth, expireYear, cvc);
        this.threeDSessionID = await this.get3DSession(amount, pointAmount, installmentCount, currency, languageCode);

        const threeDInitResult = await this.get3DInit(callbackURL, languageCode);

        return {
            ...threeDInitResult,
            cardToken: this.cardToken,
            threeDSessionID: this.threeDSessionID,
            amount,
            cardHolderName: cardholderName,
            currency: this.currency
        };
    }

    async getCardToken(cardNumber, cardholderName, expireMonth, expireYear, cvc) {
        cardNumber = cardNumber.replace(/\s+/g, '');

        const formData = new FormData();
        formData.append('CardNumber', cardNumber);
        formData.append('ExpireMonth', expireMonth);
        formData.append('ExpireYear', expireYear);
        formData.append('Cvv', cvc);
        formData.append('PublicKey', this.apiKey);
        formData.append('Nonce', this.nonce.toString());
        formData.append('Signature', this.signature);
        formData.append('ConversationId', this.conversationId);
        formData.append('MerchantNumber', this.merchantNumber);
        formData.append('CardHolderName', cardholderName);

        try {
            const response = await this.multipartClient.post('/v1/Tokens', formData);
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                return decodedResponse.cardToken;
            }
            throw new Error(decodedResponse.errorMessage || 'Unknown error');
        } catch (e) {
            throw e;
        }
    }

    async get3DSession(amount, pointAmount, installmentCount, currency = 'TRY', languageCode = 'TR') {
        this.amount = amount;
        this.currency = currency;

        const data = {
            amount,
            pointAmount,
            cardToken: this.cardToken,
            currency,
            paymentType: 'Auth',
            installmentCount,
            languageCode
        };

        try {
            const response = await this.jsonClient.post('/v1/threeds/getthreedsession', data);
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                return decodedResponse.threeDSessionId;
            }
            throw new Error(decodedResponse.errorMessage || 'Unknown error');
        } catch (e) {
            throw e;
        }
    }

    async get3DInit(callbackURL, languageCode = 'TR') {
        const formData = new FormData();
        formData.append('ThreeDSessionId', this.threeDSessionID);
        formData.append('CallbackUrl', callbackURL);
        formData.append('LanguageCode', languageCode);
        formData.append('ClientIpAddress', this.clientIpAddress);
        formData.append('PublicKey', this.apiKey);
        formData.append('Nonce', this.nonce.toString());
        formData.append('Signature', this.signature);
        formData.append('ConversationId', this.conversationId);
        formData.append('MerchantNumber', this.merchantNumber);
        formData.append('CardHolderName', this.cardholderName);

        try {
            const response = await this.multipartClient.post('/v1/threeds/init3ds', formData);
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                return decodedResponse;
            }
            throw new Error(decodedResponse.errorMessage || 'Unknown error');
        } catch (e) {
            throw e;
        }
    }

    async complete3DS(threeDSessionID, amount, installmentCount, cardHolderName, cardToken, currency = 'TRY') {
        const result = await this.get3DSessionResult(threeDSessionID);
        if (result === 'VerificationFinished') {
            return await this.provision(amount, installmentCount, cardHolderName, cardToken, threeDSessionID, currency);
        } else {
            return { errorMessage: '3D Secure process is not completed yet.', isSucceed: false };
        }
    }

    async get3DSessionResult(threeDSessionId, languageCode = 'TR') {
        const data = {
            threeDSessionId,
            languageCode
        };

        try {
            const response = await this.jsonClient.post('/v1/threeds/getthreedsessionresult', data);
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                return decodedResponse.currentStep;
            } else {
                return JSON.stringify({
                    error: decodedResponse.errorMessage
                });
            }
        } catch (error) {
            return JSON.stringify({
                error: error.message
            });
        }
    }

    async provision(amount, installmentCount, cardHolderName, cardToken, threeDSessionId, currency = 'TRY') {
        const data = {
            amount,
            cardToken,
            currency,
            paymentType: 'Auth',
            cardHolderName,
            installmentCount,
            threeDSessionId
        };

        try {
            const response = await this.jsonClient.post('/v1/Payments/provision', data);
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                // TODO: Clear the session data set before.
                return JSON.stringify(decodedResponse);
            } else {
                return {
                    errorMessage: decodedResponse.errorMessage,
                    isSucceed: false
                };
            }
        } catch (error) {
            return {
                errorMessage: error.message,
                isSucceed: false
            };
        }
    }

    async getPoints(cardNumber, cardholderName, expireMonth, expireYear, cvc) {
        this.cardToken = await this.getCardToken(cardNumber, cardholderName, expireMonth, expireYear, cvc);
        return await this.pointInquiry(this.cardToken);
    }

    async reverse(orderid, languageCode = 'TR') {
        const data = { orderid, languageCode };

        console.log(data);

        try {
            const response = await this.jsonClient.post('/v1/Payments/reverse', data);
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                return decodedResponse;
            }
            return { errorMessage: decodedResponse.errorMessage, isSucceed: false };
        } catch (e) {
            return { errorMessage: e.message, isSucceed: false };
        }
    }

    async return(amount, orderid, languageCode = 'TR') {
        const data = { amount, orderid, languageCode };

        try {
            const response = await this.jsonClient.post('/v1/Payments/return', data);
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                return decodedResponse;
            }
            return { errorMessage: decodedResponse.errorMessage, isSucceed: false };
        } catch (e) {
            return { errorMessage: e.message, isSucceed: false };
        }
    }

    async binInfo(binNumber, languageCode = 'TR') {
        const data = {
            binNumber,
            languageCode
        };

        try {
            const response = await this.jsonClient.post('/v1/Payments/bin-information', data);
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                return decodedResponse;
            } else {
                return {
                    errorMessage: decodedResponse.errorMessage,
                    isSucceed: false
                };
            }
        } catch (error) {
            return {
                errorMessage: error.message,
                isSucceed: false
            };
        }
    }

    async installment(binNumber, merchantNumber, amount) {
        try {
            const response = await this.jsonClient.get('/v1/Installment', {
                params: {
                    binNumber,
                    amount,
                    merchantNumber
                }
            });
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                return decodedResponse;
            } else {
                return {
                    errorMessage: decodedResponse.errorMessage,
                    isSucceed: false
                };
            }
        } catch (error) {
            return {
                errorMessage: error.message,
                isSucceed: false
            };
        }
    }

    async pointInquiry(cardToken, languageCode = 'TR', currency = 'TRY') {
        const data = {
            cardToken,
            languageCode,
            currency
        };

        try {
            const response = await this.jsonClient.post('/v1/Payments/pointInquiry', data);
            const decodedResponse = response.data;

            if (this.checkError(decodedResponse)) {
                return decodedResponse;
            } else {
                return {
                    errorMessage: decodedResponse.errorMessage,
                    isSucceed: false
                };
            }
        } catch (error) {
            return {
                errorMessage: error.message,
                isSucceed: false
            };
        }
    }

    checkError(data) {
        return data.isSucceed === true;
    }
}

module.exports = Parakolay;