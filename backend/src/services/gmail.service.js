const { google } = require('googleapis');
const { env } = require('../config/env');
const { User } = require('../models/User');
const { Job } = require('../models/Job');
const { encrypt, decrypt } = require('../utils/encryption');
const crypto = require('crypto');

function createOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

async function getAuthUrl(userId) {
  const oauth2Client = createOAuth2Client();
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

  // Generate a cryptographically random state token to prevent CSRF
  const stateToken = crypto.randomBytes(32).toString('hex');

  // Store the state token on the user for callback validation
  await User.findByIdAndUpdate(userId, {
    gmailOAuthState: stateToken
  });

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: `${userId}:${stateToken}`
  });
}

async function handleCallback(code, stateParam) {
  // Parse and validate the CSRF state token
  const separatorIndex = stateParam.indexOf(':');
  if (separatorIndex === -1) throw new Error('Invalid OAuth state');

  const userId = stateParam.substring(0, separatorIndex);
  const stateToken = stateParam.substring(separatorIndex + 1);

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!user.gmailOAuthState || user.gmailOAuthState !== stateToken) {
    throw new Error('Invalid OAuth state — possible CSRF attack');
  }

  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  // Encrypt tokens before storing
  user.gmailTokens = encrypt(tokens);
  user.gmailConnected = true;
  user.gmailOAuthState = ''; // Clear the one-time state token
  await user.save();

  return { success: true };
}

/**
 * Creates an authenticated OAuth2 client with auto-refresh support.
 * Persists new tokens back to DB when they are refreshed.
 */
async function getAuthenticatedClient(userId) {
  const user = await User.findById(userId).select('+gmailTokens');
  if (!user || !user.gmailConnected || !user.gmailTokens) {
    throw new Error('Gmail not connected');
  }

  // Decrypt stored tokens
  const tokens = decrypt(user.gmailTokens);
  if (!tokens) {
    throw new Error('Failed to decrypt Gmail tokens — reconnect required');
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // Listen for automatic token refresh and persist new tokens
  oauth2Client.on('tokens', async (newTokens) => {
    const mergedTokens = { ...tokens, ...newTokens };
    await User.findByIdAndUpdate(userId, {
      gmailTokens: encrypt(mergedTokens)
    });
  });

  return { oauth2Client, user };
}

async function syncEmails(userId) {
  const { oauth2Client } = await getAuthenticatedClient(userId);

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const query = 'online assessment OR OA OR interview OR shortlisted OR coding test OR hiring challenge';

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 20
  });

  const messages = res.data.messages || [];

  const jobs = await Job.find({ userId });
  const companies = jobs.map(j => j.company.toLowerCase());

  // Fetch messages in parallel (batches of 5) instead of sequentially
  const batchSize = 5;
  const parsedEmails = [];

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (msg) => {
        const msgData = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id
        });

        const payload = msgData.data.payload;
        const headers = payload.headers || [];

        let subject = '';
        let from = '';
        let date = '';

        headers.forEach(h => {
          if (h.name === 'Subject') subject = h.value;
          if (h.name === 'From') from = h.value;
          if (h.name === 'Date') date = h.value;
        });

        let matchedCompany = '';
        const subjectLower = subject.toLowerCase();
        const fromLower = from.toLowerCase();

        for (const company of companies) {
          if (subjectLower.includes(company) || fromLower.includes(company)) {
            matchedCompany = company;
            break;
          }
        }

        return {
          id: msgData.data.id,
          threadId: msgData.data.threadId,
          subject,
          from,
          date,
          snippet: msgData.data.snippet,
          matchedCompany
        };
      })
    );

    parsedEmails.push(...batchResults);
  }

  return parsedEmails;
}

async function getRecentUpdates(userId, limit = 10) {
  const emails = await syncEmails(userId);
  return emails.slice(0, limit);
}

async function disconnect(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.gmailTokens = '';
  user.gmailConnected = false;
  user.gmailOAuthState = '';
  await user.save();
  return { success: true };
}

module.exports = {
  createOAuth2Client,
  getAuthUrl,
  handleCallback,
  syncEmails,
  getRecentUpdates,
  disconnect
};
