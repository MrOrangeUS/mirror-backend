const socket = io();
const video = document.getElementById('avatar');
const status = document.getElementById('status');
const qr = document.getElementById('qr');

let peerConnection;
let streamId;
let sessionId;

// Initialize WebRTC
async function initWebRTC() {
    try {
        // Create stream and get offer/ICE servers
        const response = await fetch('/streams', { method: 'POST' });
        const { streamId, sessionId, offer, iceServers } = await response.json();
        window.streamId = streamId;
        window.sessionId = sessionId;

        peerConnection = new RTCPeerConnection({ iceServers });

        let firstIceCandidateSent = false;
        let pendingAnswer = null;

        peerConnection.ontrack = (event) => {
            video.srcObject = event.streams[0];
            status.style.display = 'none';
        };

        peerConnection.onicecandidate = async (event) => {
            if (event.candidate && !firstIceCandidateSent) {
                console.log('Sending first ICE candidate:', event.candidate);
                await fetch(`/streams/${streamId}/ice`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex
                    })
                });
                firstIceCandidateSent = true;
                if (pendingAnswer) {
                    console.log('Sending answer after ICE:', pendingAnswer);
                    await fetch(`/streams/${streamId}/sdp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ answer: pendingAnswer })
                    });
                    pendingAnswer = null;
                }
            } else if (event.candidate) {
                await fetch(`/streams/${streamId}/ice`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex
                    })
                });
            }
        };

        await peerConnection.setRemoteDescription({ type: 'offer', sdp: offer });

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        const answerObj = { type: answer.type, sdp: answer.sdp };
        console.log('Prepared answer object:', answerObj);
        if (firstIceCandidateSent) {
            console.log('Sending answer immediately:', answerObj);
            await fetch(`/streams/${streamId}/sdp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: answerObj })
            });
        } else {
            pendingAnswer = answerObj;
        }
    } catch (error) {
        console.error('WebRTC initialization error:', error);
        status.textContent = 'Connection failed. Retrying...';
        setTimeout(initWebRTC, 30000);
    }
}

// Handle chat messages
async function handleChatMessage(message) {
    try {
        // Get response from ChatGPT
        const chatResponse = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const { response } = await chatResponse.json();

        // Send to D-ID
        await fetch(`/streams/${streamId}/say`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: response })
        });
    } catch (error) {
        console.error('Chat handling error:', error);
    }
}

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    initWebRTC();
});

socket.on('chat_message', handleChatMessage);

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    status.style.display = 'block';
    status.textContent = 'Disconnected. Reconnecting...';
});

// Generate QR code
async function generateQR() {
    try {
        const response = await fetch('/qr');
        const { qrCode } = await response.json();
        qr.innerHTML = qrCode;
    } catch (error) {
        console.error('QR code generation error:', error);
    }
}

// Initialize
generateQR();

// Chat UI logic
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg ' + sender;
    msgDiv.textContent = text;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    appendMessage(message, 'user');
    chatInput.value = '';
    try {
        // Get response from ChatGPT
        const chatResponse = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const { response } = await chatResponse.json();
        appendMessage(response, 'bot');
        // Avatar speech is disabled for now
        // await fetch(`/streams/${streamId}/say`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ text: response })
        // });
    } catch (error) {
        appendMessage('Error: Could not get response.', 'bot');
        console.error('Chat handling error:', error);
    }
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// On page load, show the conversation starter
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/chat-starter');
        const { starter } = await res.json();
        appendMessage(starter, 'bot');
    } catch (e) {
        appendMessage('Welcome! Ask me anything.', 'bot');
    }
}); 