const express = require('express');
const axios = require('axios');
const cors = require("cors");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: ['http://localhost:3000', 'https://lotuscrm.vercel.app'],
    credentials: true
}));

const ZOHO_AUTH_URL = 'https://accounts.zoho.com/oauth/v2/auth';
const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';
const SCOPES = 'SalesIQ.operators.READ,SalesIQ.operators.UPDATE';

// 1. Redirect to Zoho Authorization Page
app.get('/auth', (req, res) => {
    const authURL = `${ZOHO_AUTH_URL}?response_type=code&client_id=${process.env.CLIENT_ID}&scope=${SCOPES}&redirect_uri=${process.env.REDIRECT_URI}&access_type=offline&prompt=consent&state=random_state`;
    console.log("Redirecting to Zoho Auth:", authURL);
    res.redirect(authURL);
});

// 2. Handle OAuth Callback
app.get('/oauth/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const tokenResponse = await axios.post(ZOHO_TOKEN_URL, null, {
            params: {
                code,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URI,
                grant_type: 'authorization_code',
            },
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // TODO: Save access_token and refresh_token securely (e.g., database)
        console.log('✅ Access Token:', access_token);
        console.log('🔄 Refresh Token:', refresh_token);

        res.redirect(`${process.env.REDIRECT_URI}?success=true`);
    } catch (error) {
        console.error("❌ Error getting token:", error.response?.data || error.message);
        res.status(500).send('Failed to get access token.');
    }
});

// 3. Example API Call (uses dummy access token)
app.get('/api/operators', async (req, res) => {
    const accessToken = 'YOUR_SAVED_ACCESS_TOKEN'; // Replace this

    try {
        const response = await axios.get('https://salesiq.zoho.com/api/v2/operators', {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error("❌ Error fetching operators:", error.response?.data || error.message);
        res.status(500).send('Error fetching operators');
    }
});

// 4. Refresh Token Endpoint (optional)
app.get('/refresh-token', async (req, res) => {
    const refresh_token = 'YOUR_SAVED_REFRESH_TOKEN'; // Replace this

    try {
        const response = await axios.post(ZOHO_TOKEN_URL, null, {
            params: {
                refresh_token,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                redirect_uri: process.env.REDIRECT_URI,
                grant_type: 'refresh_token',
            },
        });

        const { access_token } = response.data;
        console.log('🔄 New Access Token:', access_token);
        res.send('Access token refreshed');
    } catch (err) {
        console.error("❌ Refresh error:", err.response?.data || err.message);
        res.status(500).send('Failed to refresh token');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
