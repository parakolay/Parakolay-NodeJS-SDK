const crypto = require('crypto');

class Helpers {
    static getMilliseconds() {
        return Date.now();
    }

    static generate(message, key) {
        const keyBuffer = Buffer.from(key, 'base64');
        const messageBuffer = Buffer.from(message, 'utf-8');
        const hmac = crypto.createHmac('sha256', keyBuffer);
        hmac.update(messageBuffer);
        return hmac.digest('base64');
    }

    static generateSignature(apiKey, apiSecret, nonce, conversationId) {
        const message = `${apiKey}${nonce}`;
        const securityData = this.generate(message, apiSecret);
        const secondMessage = `${apiSecret}${conversationId}${nonce}${securityData}`;
        const signature = this.generate(secondMessage, apiSecret);
        return signature;
    }
}

module.exports = { Helpers };