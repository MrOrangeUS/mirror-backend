const axios = require('axios');
const { getSpeechFrom11Labs } = require('./ttsService');
const fs = require('fs');

const D_ID_API_URL = process.env.D_ID_API_URL || 'https://api.d-id.com';
const D_ID_KEY = process.env.D_ID_KEY;
const AVATAR_URL = process.env.D_ID_AVATAR_URL;

const didClient = axios.create({
  baseURL: D_ID_API_URL,
  headers: {
    'Authorization': `Basic ${D_ID_KEY}`,
    'Content-Type': 'application/json'
  }
});

class DIDService {
  async createStream() {
    try {
      const response = await didClient.post('/talks/streams', {
        source_url: AVATAR_URL,
        driver_url: 'bank://lively',
        config: {
          stitch: true
        }
      });
      
      return {
        streamId: response.data.id,
        sessionId: response.data.session_id
      };
    } catch (error) {
      console.error('D-ID createStream error:', error.response?.data || error.message);
      throw error;
    }
  }

  async handleSDP(streamId, sessionId, sdp) {
    try {
      await didClient.post(`/talks/streams/${streamId}/sdp`, {
        session_id: sessionId,
        sdp
      });
    } catch (error) {
      console.error('D-ID handleSDP error:', error.response?.data || error.message);
      throw error;
    }
  }

  async handleICE(streamId, sessionId, candidate) {
    try {
      await didClient.post(`/talks/streams/${streamId}/ice`, {
        session_id: sessionId,
        candidate
      });
    } catch (error) {
      console.error('D-ID handleICE error:', error.response?.data || error.message);
      throw error;
    }
  }

  async say(streamId, sessionId, text) {
    try {
      // Get a public URL to the ElevenLabs audio file
      const audioUrl = await getSpeechFrom11Labs(text);
      await didClient.post(
        `/talks/streams/${streamId}`,
        {
          session_id: sessionId,
          script: {
            type: 'audio',
            audio_url: audioUrl,
          }
        }
      );
    } catch (error) {
      console.error('D-ID say error:', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteStream(streamId, sessionId) {
    try {
      await didClient.delete(`/talks/streams/${streamId}`, {
        data: { session_id: sessionId }
      });
    } catch (error) {
      console.error('D-ID deleteStream error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new DIDService(); 