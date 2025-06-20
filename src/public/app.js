const socket = io();
const video = document.getElementById('avatar');
const status = document.getElementById('status');
const qr = document.getElementById('qr');

let peerConnection;
let streamId;
let sessionId;
let iceCandidateQueue = [];
let isProcessingIceQueue = false;
const ICE_CANDIDATE_DELAY = 1000; // 1 second delay between ICE candidates

// Process ICE candidate queue with rate limiting
async function processIceCandidateQueue() {
    if (isProcessingIceQueue || iceCandidateQueue.length === 0) return;
    
    isProcessingIceQueue = true;
    const candidate = iceCandidateQueue.shift();
    
    try {
        logToUI('Sending ICE candidate: ' + JSON.stringify(candidate));
        const iceResp = await fetch(`/streams/${streamId}/ice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex
            })
        });
        
        if (iceResp.status === 429) {
            logToUI('Rate limit hit for ICE candidate, will retry later');
            iceCandidateQueue.unshift(candidate); // Put back at front of queue
            setTimeout(processIceCandidateQueue, 5000); // Wait 5 seconds before retry
            return;
        }
        
        logToUI('POST /streams/' + streamId + '/ice response status: ' + iceResp.status);
    } catch (iceErr) {
        logToUI('ICE candidate POST error: ' + iceErr.message);
        iceCandidateQueue.unshift(candidate); // Put back at front of queue
    }
    
    isProcessingIceQueue = false;
    setTimeout(processIceCandidateQueue, ICE_CANDIDATE_DELAY);
}

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

        // 1) Grab a new stream, D-ID's SDP offer, and ICE servers
        const streamResp = await fetch('/streams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        logToUI('POST /streams response status: ' + streamResp.status);
        
        if (streamResp.status === 429) {
            logToUI('Rate limit hit for stream creation, retrying in 5 seconds...');
            setTimeout(initWebRTC, 5000);
            return;
        }
        
        if (streamResp.status === 403) {
            const err = await streamResp.json();
            logToUI('D-ID error: ' + err.error);
            alert('D-ID error: ' + err.error + '. Please close other sessions or try again later.');
            return;
        }
        
        const { streamId: newStreamId, sessionId: newSessionId, offer, iceServers } = await streamResp.json();
        streamId = newStreamId;
        sessionId = newSessionId;
        logToUI(`Received streamId: ${streamId}, sessionId: ${sessionId}`);
        logToUI('Received offer: ' + offer);
        logToUI('Received iceServers: ' + JSON.stringify(iceServers));

        // 2) Build RTCPeerConnection with backend-provided ICE servers
        peerConnection = new RTCPeerConnection({ iceServers });
        logToUI('Created RTCPeerConnection with backend ICE servers');

        // 3) When video arrives, hook it up
        peerConnection.ontrack = evt => {
            video.srcObject = evt.streams[0];
            status.style.display = 'none';
            logToUI('ontrack fired: video stream received');
        };

        // 4) Queue ICE candidates for rate-limited sending
        peerConnection.onicecandidate = evt => {
            if (!evt.candidate) return;
            iceCandidateQueue.push(evt.candidate);
            processIceCandidateQueue();
        };

        // 5) Apply D-ID's offer (must be the raw SDP string)
        await peerConnection.setRemoteDescription({
            type: 'offer',
            sdp: offer
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
        
        if (sdpResp.status === 429) {
            logToUI('Rate limit hit for SDP answer, retrying in 5 seconds...');
            setTimeout(() => {
                fetch(`/streams/${streamId}/sdp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answer: { type: answer.type, sdp: answer.sdp } })
                });
            }, 5000);
        }
        
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
        if (status) status.textContent = 'Connection failed—retrying…';
        if (err && err.message && err.message.includes('max user sessions')) {
            logToUI('Not retrying due to D-ID session limit.');
            return;
        }
        logToUI('Retrying initWebRTC in 10 seconds...');
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