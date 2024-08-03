const title = document.getElementById("title")
const thumbnail = document.getElementById("thumbnail")

const params = new URLSearchParams(window.location.search)
const board = params.get("board")

fetch(`/board?board=${board}`).then(res => res.json()).then(data => {
    title.innerHTML = data.name
    thumbnail.src = data.picture.imageURL
}).catch(showError)

const startButton = document.getElementById('startButton');
const endButton = document.getElementById('endButton');
const outputDiv = document.getElementById('output');
let error = false

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

    recognition.onresult = event => {
        if (error) return recognition.abort()
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

/**
 * @type {string[]}
 */
const sendArr = []
let started = false

function send(content) {
    sendArr.push(content)
    if (!started) start()
}

async function start() {
    started = true
    while (sendArr.length) {
        await fetch(`/chat?board=${board}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: sendArr.shift()
            })
        }).catch(showError)
    }
    started = false
}

function showError() {
    outputDiv.innerHTML = "An error occured, please check the terminal for details"
    error = true
}