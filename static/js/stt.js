const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const outputDiv = document.getElementById('output');

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)();
recognition.lang = 'en-US';
recognition.continuous = true
recognition.interimResults = true

initListeners()

function initListeners() {
    recognition.onstart = () => {
        startButton.textContent = 'Listening...';
    };

    recognition.onresult = (event) => {
        displayTranscript(event)
    };

    recognition.onend = () => {
        startButton.textContent = 'Start transcription';
    };

    startButton.addEventListener('click', () => {
        recognition.start();
    });

    endButton.addEventListener('click', () => {
        recognition.stop()
    })
}

function displayTranscript({ results }) {
    const lines = []
    for (const line of results) {
        lines.push(line[0].transcript)
    }
    console.log(lines)
    outputDiv.innerHTML = lines.join("<br>");
}