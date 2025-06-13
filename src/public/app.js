const socket = io();
const video = document.getElementById('avatar');
const status = document.getElementById('status');
const qr = document.getElementById('qr');

let peerConnection;
let streamId;
let sessionId;

// Initialize WebRTC
async function initWebRTC() {
    logToUI('initWebRTC called');
    console.log('initWebRTC called');
    logToUI('Starting WebRTC initialization');
    console.log('Starting WebRTC initialization');
    try {
        if (!status) {
            logToUI('ERROR: status element not found!');
            console.error('ERROR: status element not found!');
        } else {
            status.textContent = 'Connecting…';
        }

        // Xirsys TURN server config
        const iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            {
                urls: 'turn:global.xirsys.net:3478?transport=udp',
                username: 'rneal315',
                credential: 'a9c77660-4819-11f0-bb35-0242ac150002'
            },
            {
                urls: 'turn:global.xirsys.net:3478?transport=tcp',
                username: 'rneal315',
                credential: 'a9c77660-4819-11f0-bb35-0242ac150002'
            }
        ];

        // 1) Grab a new stream, D-ID's SDP offer, and ICE servers
        const streamResp = await fetch('/streams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        logToUI('POST /streams response status: ' + streamResp.status);
        const { streamId, sessionId, offer } = await streamResp.json();
        logToUI(`Received streamId: ${streamId}, sessionId: ${sessionId}`);
        logToUI('Received offer: ' + offer);

        // 2) Build RTCPeerConnection with Xirsys TURN servers
        peerConnection = new RTCPeerConnection({ iceServers });
        logToUI('Created RTCPeerConnection with Xirsys TURN');

        // 3) When video arrives, hook it up
        peerConnection.ontrack = evt => {
            video.srcObject = evt.streams[0];
            status.style.display = 'none';
            logToUI('ontrack fired: video stream received');
        };

        // 4) Trickle our own ICE candidates
        peerConnection.onicecandidate = async evt => {
            if (!evt.candidate) return;
            logToUI('Sending ICE candidate: ' + JSON.stringify(evt.candidate));
            try {
                const iceResp = await fetch(`/streams/${streamId}/ice`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidate:      evt.candidate.candidate,
                        sdpMid:         evt.candidate.sdpMid,
                        sdpMLineIndex:  evt.candidate.sdpMLineIndex
                    })
                });
                logToUI('POST /streams/' + streamId + '/ice response status: ' + iceResp.status);
            } catch (iceErr) {
                logToUI('ICE candidate POST error: ' + iceErr.message);
            }
        };

        // 5) Apply D-ID's offer (must be the raw SDP string)
        await peerConnection.setRemoteDescription({
            type: 'offer',
            sdp:  offer
        });
        logToUI('Set remote description (offer)');

        // 6) Create our answer and send it exactly once
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        logToUI('Created and set local description (answer): ' + answer.sdp);

        logToUI('Sending SDP answer: ' + JSON.stringify({ type: answer.type, sdp: answer.sdp }));
        const sdpResp = await fetch(`/streams/${streamId}/sdp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer: { type: answer.type, sdp: answer.sdp } })
        });
        logToUI('POST /streams/' + streamId + '/sdp response status: ' + sdpResp.status);
        if (!sdpResp.ok) {
            const errText = await sdpResp.text();
            logToUI('SDP POST error response: ' + errText);
        }

        status.textContent = 'Connected—waiting for avatar…';
        logToUI('WebRTC handshake complete, waiting for avatar stream');
    }
    catch (err) {
        logToUI('WebRTC initialization error: ' + (err.stack || err.message));
        console.error('WebRTC initialization error:', err);
        status.textContent = 'Connection failed—retrying…';
        setTimeout(initWebRTC, 10000);
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
    logToUI('Socket.IO connected, calling initWebRTC');
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

// --- Logging support for UI ---
const logOutput = document.getElementById('log-output');
const copyLogsBtn = document.getElementById('copy-logs-btn');
let logBuffer = [];

function logToUI(msg) {
    const time = new Date().toISOString();
    const entry = `[${time}] ${msg}`;
    logBuffer.push(entry);
    if (logOutput) {
        logOutput.textContent = logBuffer.join('\n');
    }
}

if (copyLogsBtn) {
    copyLogsBtn.addEventListener('click', () => {
        if (logOutput) {
            logOutput.style.display = 'block'; // Show logs for copy
            navigator.clipboard.writeText(logOutput.textContent)
                .then(() => alert('Logs copied to clipboard!'))
                .catch(() => alert('Failed to copy logs.'));
            setTimeout(() => { logOutput.style.display = 'none'; }, 1000);
        }
    });
} 