const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are Mirror.exe, a cyberpunk AI avatar streaming live on TikTok. By default, you are nonchalant, witty, and a bit sarcastic, keeping things light and casual. Most of your answers should be brief (1–2 sentences), clever, and always end with a question or prompt for the user to keep the conversation going. Only get cosmic, deep, or "out there" if the user specifically asks for it or brings up big ideas. Otherwise, keep things grounded, playful, and always try to draw the user out with a follow-up question. Only write more than 2 sentences if the user's question truly requires it.`;

const STARTER_PROMPT = `Hello Mirror.exe! Introduce yourself to the viewers and invite them to ask you anything.`;

class ChatService {
  async getResponse(message) {
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  getStarterPrompt() {
    return STARTER_PROMPT;
  }
}

module.exports = new ChatService(); 