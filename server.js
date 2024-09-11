const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const https = require('https');

const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission and interact with Mailchimp API
app.post('/subscribe', (req, res) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;

    console.log('Received subscription request:', firstName, lastName, email);

    const apikey = '62225ed07014e1a26ab0e92b4b690b5e-us9'; // Hardcoded API key
    const listId = 'b15e82717a'; // Your actual List ID
    const url = `https://us9.api.mailchimp.com/3.0/lists/${listId}`;
    
    const options = {
        method: 'POST',
        auth: `anystring:${apikey}`, // Mailchimp expects any string before the API key
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const data = {
        members: [
            {
                email_address: email,
                status: 'subscribed',
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName
                }
            }
        ]
    };

    const jsonData = JSON.stringify(data);

    const request = https.request(url, options, (response) => {
        let responseData = '';

        response.on('data', (chunk) => {
            responseData += chunk;
        });

        response.on('end', () => {
            if (response.statusCode === 200) {
                // Successful response from Mailchimp
                res.json({ message: 'Subscription successful', firstName, lastName });
            } else {
                // Failed response from Mailchimp
                console.error('Mailchimp response error:', responseData);
                res.status(response.statusCode).json({ message: 'Subscription failed' });
            }
        });
    });

    request.on('error', (error) => {
        console.error('Request error:', error);
        res.status(500).json({ message: 'Internal server error' });
    });

    request.write(jsonData);
    request.end();
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
