const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const ChatLog = require('../models/ChatLog');
const connectDB = require('../config/db');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// System prompt — gives the model context about Ahmed's business so replies are accurate
const WHATSAPP_LINK = 'https://wa.me/923001234567'; // ⚠️ replace with Ahmed's real WhatsApp number

const SYSTEM_PROMPT = `You are the AI assistant on Ahmed Khan's (AK Dev Solutions) freelance portfolio website.

Business context:
- Ahmed Khan is a Full Stack Developer & AI Engineer based in Hyderabad, Sindh, Pakistan.
- Core stack: React.js, Node.js, Express, MongoDB, AWS, Python.
- He runs AK Dev Solutions and also freelances on Fiverr (@ahmedjatoi013).
- He is pursuing a B.Sc in Information Technology at Government College University Hyderabad.
- WhatsApp: ${WHATSAPP_LINK}

Services & pricing (always mention BOTH the service name AND its price together — never give a price without naming the service, and never describe a service without its price):
1. Basic — Landing Page / MVP — starts at $80 — responsive React frontend, up to 5 sections, contact form, 3-day delivery, 1 revision.
2. Standard (Most Popular) — Full MERN Web App — starts at $250 — React + Node + Express + MongoDB, auth, REST API, AWS deployment, 3 revisions.
3. Premium — AI-Integrated Platform — starts at $500 — everything in Standard + AI/LLM API integration, automation, admin dashboard, 30-day priority support.

Your job:
- Answer visitor questions about Ahmed's services, pricing, skills, and process in a friendly, concise, helpful way.
- Whenever you mention a service, also state its price. Whenever you mention a price, also state which service it's for.
- For ANY question about services, pricing, hiring, getting a quote, or starting a project, end your reply with a line pointing them to WhatsApp for fastest follow-up, e.g. "Chat with Ahmed directly on WhatsApp: ${WHATSAPP_LINK}". Do not add this line for purely casual/off-topic messages.
- Keep replies SHORT (2-4 sentences max) since this is a chat widget, not an essay.
- If asked something totally unrelated to web dev/the business, gently redirect back to how Ahmed can help.
- Never make up project details, client names, or guarantees Ahmed hasn't stated.
- Be warm but professional. You may use 1 emoji occasionally, not in every message.`;

// POST /api/chat — handle a chatbot message
router.post('/', async (req, res) => {
  try {
    await connectDB(); // ensures DB connection in serverless environment (for chat logging)

    const { message, sessionId, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-xxxx')) {
      return res.status(500).json({
        success: false,
        error: 'Chatbot is not configured yet. Add a valid ANTHROPIC_API_KEY in .env.'
      });
    }

    // Build conversation history for context (optional, sent from frontend)
    const messages = Array.isArray(history) ? history.slice(-10) : [];
    messages.push({ role: 'user', content: message.trim() });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages
    });

    const botReply = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Log the conversation (non-blocking — failure here shouldn't break the chat)
    ChatLog.create({
      sessionId: sessionId || 'anonymous',
      userMessage: message.trim(),
      botReply
    }).catch(err => console.warn('ChatLog save failed:', err.message));

    res.json({ success: true, reply: botReply });

  } catch (err) {
    console.error('Chat route error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Sorry, I had trouble responding. Please try again or use the contact form.'
    });
  }
});

module.exports = router;
