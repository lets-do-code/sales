const express = require('express');
const axios = require('axios');
const cors = require("cors");
require('dotenv').config();

const app = express();
const PORT = 4000;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
const ZOHO_AUTH_URL = 'https://accounts.zoho.com/oauth/v2/auth';
const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';

const SCOPES = 'SalesIQ.operators.READ,SalesIQ.operators.UPDATE';



// 1. Redirect user to Zoho Authorization page
app.get('/auth', (req, res) => {
    const authURL = `${ZOHO_AUTH_URL}?response_type=code&client_id=${process.env.CLIENT_ID}&scope=${SCOPES}&redirect_uri=${process.env.REDIRECT_URI}&access_type=offline&prompt=consent&state=random_state`;

    res.redirect(authURL);
});

// 2. Handle OAuth callback and exchange code for access token
app.get('/oauth/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const tokenResponse = await axios.post(ZOHO_TOKEN_URL, null, {
            params: {
                code: code,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URI,
                grant_type: 'authorization_code',
            },
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Save the tokens securely (DB, file, etc.)
        console.log('Access Token:', access_token);
        console.log('Refresh Token:', refresh_token);

        res.send('Authorization successful! You can now call Zoho APIs.');
    } catch (error) {
        console.error(error.response.data);
        res.status(500).send('Failed to get access token.');
    }
});

// 3. Use access token to call SalesIQ API (Example)
app.get('/api/operators', async (req, res) => {
    const accessToken = 'YOUR_SAVED_ACCESS_TOKEN'; // Replace with your saved token

    try {
        const response = await axios.get('https://salesiq.zoho.com/api/v2/operators', {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error(error.response.data);
        res.status(500).send('Error fetching operators');
    }
});
app.get('/refresh-token', async (req, res) => {
    const refresh_token = 'YOUR_SAVED_REFRESH_TOKEN';

    try {
        const response = await axios.post(ZOHO_TOKEN_URL, null, {
            params: {
                refresh_token: refresh_token,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URI,
                grant_type: 'refresh_token',
            },
        });

        const { access_token } = response.data;
        console.log('New Access Token:', access_token);
        res.send('Access token refreshed');
    } catch (err) {
        console.error(err.response.data);
        res.status(500).send('Failed to refresh token');
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
