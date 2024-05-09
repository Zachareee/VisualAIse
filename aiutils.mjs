import ollama from 'ollama'
import { createCard, deleteCard, updateCard } from './miroutils.mjs'

await ollama.create({ model: "interpreter", path: "ModelFile" })

export function chat(miroapi, board, content) {
    ollama.chat({
        model: "interpreter",
        messages: [{ role: "user", content }]
    }).then(res => res.message.content).then(data => decide(miroapi, board, data))
}

function decide(miroapi, board, data) {
    const { command, title } = JSON.parse(data)

    switch (command) {
        case "addCard":
            createCard(miroapi, board, { data: { title }, position: { x: 0, y: 0 } })
            break
        case "removeCard":
            deleteCard(miroapi, board, title)
            break
        case "updateCard":
        default:
            console.log("default")
    }
}