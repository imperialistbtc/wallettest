/ This is your Netlify Function: /netlify/functions/create-mint-order.js

// This function will securely handle the API call to OrdinalsBot
exports.handler = async function(event) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { recipientAddress } = JSON.parse(event.body);

        if (!recipientAddress) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Recipient address is required.' }) };
        }

        // IMPORTANT: Your API key is stored securely as an environment variable, not in the code.
        const apiKey = process.env.ORDINALSBOT_API_KEY;
        if (!apiKey) {
            throw new Error('API key is not configured on the server.');
        }

        // For a PFP collection, your backend would have logic here to select a unique image.
        // For this example, we will inscribe a simple text file.
        const fileToInscribe = {
            name: 'voyager-receipt.txt',
            type: 'text/plain;charset=utf-8',
            data: `Welcome, Voyager. Your inscription was created on ${new Date().toUTCString()}.`
        };

        // Convert file data to Base64, as required by the API
        const base64data = Buffer.from(fileToInscribe.data).toString('base64');

        const apiRequestData = {
            files: [{
                name: fileToInscribe.name,
                type: fileToInscribe.type,
                data: base64data
            }],
            receiveAddress: recipientAddress,
            fee: 10, // You can adjust this fee rate. 10 is average.
            lowPostage: true
        };

        const response = await fetch('https://api.ordinalsbot.com/order', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiRequestData)
        });

        const orderData = await response.json();

        if (!response.ok) {
            throw new Error(orderData.message || 'Failed to create order with OrdinalsBot.');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                paymentAddress: orderData.charge.address,
                amountInSats: orderData.charge.amount
            })
        };

    } catch (error) {
        console.error('Backend Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
