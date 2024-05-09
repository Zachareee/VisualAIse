const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const outputDiv = document.getElementById('output');

try {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.continuous = true
    recognition.interimResults = true

    initListeners(recognition)
} catch (err) {
    alert("Speech recognition is not available for this browser")
}

function initListeners(recognition) {
    recognition.onstart = () => {
        startButton.textContent = 'Listening...';
    };

    recognition.onresult = (event) => {
        displayTranscript(event)
        sendSentence(event)
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

    outputDiv.innerHTML = lines.join("<br>");
}

function sendSentence({ results }) {
    const { length } = results

    // get last sentence of results
    const sentence = results[length - 1]

    if (sentence.isFinal) send(sentence[0].transcript)
}

function send(content) {
    fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content
        })
    }).catch(console.error)
}