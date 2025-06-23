const socket = io();
const status = document.getElementById('status');
const qr = document.getElementById('qr');

// Handle chat messages
async function handleChatMessage(message) {
    try {
        // Get response from ChatGPT with TTS
        const chatResponse = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const { response, audio } = await chatResponse.json();

        // Display the response
        appendMessage(response, 'bot');
        
        // If audio was generated, play it
        if (audio && audio.path) {
            const audioElement = new Audio(`file://${audio.path}`);
            audioElement.play().catch(err => {
                console.error('Error playing audio:', err);
            });
        }
    } catch (error) {
        console.error('Chat handling error:', error);
        appendMessage('Sorry, I encountered an error processing your message.', 'bot');
    }
}

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    logToUI('Socket.IO connected');
    status.style.display = 'none';
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
        console.error('Error generating QR code:', error);
    }
}

// Initialize QR code
generateQR();

// Chat UI functions
function appendMessage(text, sender) {
    const chatHistory = document.getElementById('chat-history');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-msg ${sender}`;
    messageDiv.textContent = text;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Display user message
    appendMessage(message, 'user');
    input.value = '';
    
    // Handle the message
    await handleChatMessage(message);
}

// Event listeners
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Logging functions
function logToUI(msg) {
    console.log(msg);
    const logOutput = document.getElementById('log-output');
    if (logOutput) {
        logOutput.textContent += new Date().toISOString() + ': ' + msg + '\n';
    }
}

// Copy logs functionality
document.getElementById('copy-logs-btn').addEventListener('click', () => {
    const logOutput = document.getElementById('log-output');
    if (logOutput && logOutput.textContent) {
        navigator.clipboard.writeText(logOutput.textContent);
        alert('Logs copied to clipboard!');
    }
}); 