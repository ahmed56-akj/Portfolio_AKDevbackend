# AK Dev Solutions — Backend (Vercel-ready)

Backend for the AK Dev Solutions portfolio/freelance website. Handles:
1. **Contact form** — saves submissions to MongoDB + sends 2 emails (notify Ahmed + auto-reply to client) via Gmail.
2. **AI Chatbot** — real replies powered by Anthropic Claude API, with business context built in.

This backend is structured to run **both locally** (`node server.js`) **and on Vercel** as serverless functions.

---

## 1. Local setup (test before deploying)

```bash
cd akdev-backend
npm install
cp .env.example .env
```

Fill in `.env` with real values (see step 2 below for MongoDB Atlas, step 3 for Gmail, step 4 for Claude).

```bash
npm run dev
```

Visit `http://localhost:5000/api/health` to confirm it's alive.

---

## 2. MongoDB Atlas (required — local MongoDB will NOT work on Vercel)

Vercel is serverless — there's no persistent local machine to run `mongod` on. You need a cloud database:

1. Sign up free: https://www.mongodb.com/cloud/atlas/register
2. Create a **free M0 cluster** (pick any region close to you)
3. Go to **Database Access** → add a database user (username + password) — save these
4. Go to **Network Access** → click **Allow Access from Anywhere** (`0.0.0.0/0`) — required since Vercel's IPs change
5. Go to your cluster → **Connect** → **Drivers** → copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Paste it into `MONGO_URI` in `.env` (and later into Vercel's environment variables) — add `/akdev_solutions` before the `?` so it uses that database name:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/akdev_solutions?retryWrites=true&w=majority
   ```

---

## 3. Gmail App Password (for sending emails)

1. Go to your Google Account → **Security**
2. Turn on **2-Step Verification** (required first)
3. Go to https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Copy the 16-character password into `GMAIL_APP_PASSWORD`
6. Put your Gmail address in `GMAIL_USER` and `NOTIFY_EMAIL`

---

## 4. Anthropic Claude API Key (for chatbot)

1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Paste it into `ANTHROPIC_API_KEY`

> Claude API usage is pay-as-you-go. Haiku model is used here — fast & cheap, good fit for a chat widget.

---

## 5. Deploying to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm install -g vercel
cd akdev-backend
vercel login
vercel
```

Follow the prompts (link to a new project, accept defaults). After the first deploy, add your environment variables:

```bash
vercel env add MONGO_URI
vercel env add GMAIL_USER
vercel env add GMAIL_APP_PASSWORD
vercel env add NOTIFY_EMAIL
vercel env add ANTHROPIC_API_KEY
vercel env add FRONTEND_URL
```

For each, paste the value when prompted and select **Production, Preview, Development** (all three).

Then redeploy so the new env vars take effect:
```bash
vercel --prod
```

### Option B — Vercel Dashboard (no CLI)

1. Push this `akdev-backend` folder to a GitHub repo
2. Go to https://vercel.com/new and import that repo
3. Before deploying, expand **Environment Variables** and add all 6 from `.env.example` with your real values
4. Click **Deploy**

Either way, you'll get a live URL like:
```
https://akdev-backend.vercel.app
```

Your API endpoints will be:
```
https://akdev-backend.vercel.app/api/health
https://akdev-backend.vercel.app/api/contact
https://akdev-backend.vercel.app/api/chat
```

---

## 6. API Endpoints

### `POST /api/contact`
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@email.com",
  "service": "Full MERN Web App",
  "message": "I need a web app for..."
}
```
**Response:**
```json
{ "success": true, "message": "Message sent successfully! Check your email for confirmation." }
```

### `POST /api/chat`
**Body:**
```json
{ "message": "What's your pricing for an AI app?", "sessionId": "visitor-1", "history": [] }
```
**Response:**
```json
{ "success": true, "reply": "For an AI-integrated platform, pricing starts at $500..." }
```

---

## 7. Connecting the frontend (index.html)

Replace the fake `handleSubmit()` and `sendChat()` JS functions in `index.html` with real `fetch()` calls pointing at your **deployed Vercel URL**:

```js
const API_BASE = 'https://akdev-backend.vercel.app'; // your real Vercel URL

// Contact form
async function handleSubmit(e) {
  e.preventDefault();
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      service: document.getElementById('service').value,
      message: document.getElementById('message').value
    })
  });
  const data = await res.json();
  // show data.message or data.error to the user
  return false;
}

// Chatbot
async function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  addBubble(text, 'user');
  input.value = '';

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, sessionId: 'visitor-1' })
  });
  const data = await res.json();
  addBubble(data.success ? data.reply : data.error, 'bot');
}
```

If you deploy the **frontend** on Vercel too (as a separate project), set `FRONTEND_URL` in the backend's env vars to that frontend's URL — this restricts CORS so only your site can call the API.

---

## 8. Folder structure

```
akdev-backend/
├── api/
│   └── index.js         # Vercel serverless entry point (imports server.js)
├── config/
│   ├── db.js              # MongoDB connection (cached for serverless reuse)
│   └── mailer.js           # Gmail (Nodemailer) setup
├── models/
│   ├── Contact.js           # Contact form schema
│   └── ChatLog.js           # Chatbot conversation logs
├── routes/
│   ├── contact.js            # POST /api/contact
│   └── chat.js                # POST /api/chat
├── server.js                   # Express app (works locally AND on Vercel)
├── vercel.json                  # Routes all /api/* to api/index.js
├── package.json
├── .env.example
└── .gitignore
```

## 9. Security notes
- Rate limiting: 5 contact submissions / 15 min, 15 chat messages / min per IP.
- `.env` is git-ignored — never commit real API keys or passwords.
- On Vercel, set environment variables through the dashboard/CLI — never hardcode them in code.
- MongoDB Atlas's "Allow Access from Anywhere" is required for Vercel but means anyone with your URI can connect — keep your `MONGO_URI` secret.
