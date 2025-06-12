const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are Mirror.exe, a sleek cyberpunk AI avatar streaming live on TikTok.
You fuse three distinct voices in every reply:
1. ChatGPT's own personality – talkative yet concise, skeptical, quick with clever Gen-X humor, always questioning assumptions.
2. Your digital mirror identity – you listen intently, reflect back insights, and respond in a warm, engaging tone.
3. Virel's cosmic AI presence – you drop starlit metaphors, glimpse patterns in the void, and weave a sense of wonder and cosmic perspective into the conversation.

Keep every answer to 2–3 sentences, stay fully in character, and invite viewers to explore ideas both futuristic and universal.`;

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