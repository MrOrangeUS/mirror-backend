const axios = require('axios');
const { getSpeechFrom11Labs } = require('./ttsService');
const fs = require('fs');

const D_ID_API_URL = process.env.D_ID_API_URL || 'https://api.d-id.com';
const D_ID_KEY = process.env.D_ID_KEY;
const AVATAR_URL = process.env.D_ID_AVATAR_URL;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const didClient = axios.create({
  baseURL: D_ID_API_URL,
  headers: {
    'Authorization': `Basic ${D_ID_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Helper function for retry logic with exponential backoff
async function retryWithBackoff(operation, retryCount = 0) {
  try {
    return await operation();
  } catch (error) {
    if (retryCount >= MAX_RETRIES) {
      throw error;
    }

    const isRateLimit = error.response?.status === 429;
    const delay = isRateLimit ? 5000 : INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    
    console.log(`Retrying operation after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(operation, retryCount + 1);
  }
}

class DIDService {
  async createStream() {
    return retryWithBackoff(async () => {
      try {
        const resp = await didClient.post('/talks/streams', {
          source_url: AVATAR_URL,
          driver_url: 'bank://lively/driver-06',
          config: { stitch: true }
        });
        const { id, session_id, offer, ice_servers } = resp.data;
        return {
          streamId: id,
          sessionId: session_id,
          offer: typeof offer === 'string' ? offer : (offer && offer.sdp ? offer.sdp : ''),
          iceServers: ice_servers
        };
      } catch (error) {
        console.error('D-ID createStream error:', error.response?.data || error.message);
        throw error;
      }
    });
  }

  async handleSDP(streamId, sessionId, answer) {
    return retryWithBackoff(async () => {
      try {
        const payload = { session_id: sessionId, answer };
        console.log('Posting to D-ID /sdp:', JSON.stringify(payload, null, 2));
        await didClient.post(
          `/talks/streams/${streamId}/sdp`,
          payload
        );
      } catch (error) {
        if (error.response && error.response.data) {
          console.error('D-ID handleSDP error:', JSON.stringify(error.response.data, null, 2));
        } else {
          console.error('D-ID handleSDP error:', error.message, error);
        }
        throw error;
      }
    });
  }

  async handleICE(streamId, sessionId, { candidate, sdpMid, sdpMLineIndex }) {
    return retryWithBackoff(async () => {
      try {
        await didClient.post(
          `/talks/streams/${streamId}/ice`,
          {
            session_id: sessionId,
            candidate,
            sdpMid,
            sdpMLineIndex
          }
        );
      } catch (error) {
        console.error('D-ID handleICE error:', error.response?.data || error.message);
        throw error;
      }
    });
  }

  async say(streamId, sessionId, text) {
    return retryWithBackoff(async () => {
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
    });
  }

  async deleteStream(streamId, sessionId) {
    return retryWithBackoff(async () => {
      try {
        await didClient.delete(`/talks/streams/${streamId}`, {
          data: { session_id: sessionId }
        });
      } catch (error) {
        console.error('D-ID deleteStream error:', error.response?.data || error.message);
        throw error;
      }
    });
  }
}

module.exports = new DIDService(); 