import ollama from 'ollama'
import { createCard, deleteCard, updateCard } from './miroutils.mjs'

await ollama.create({ model: "interpreter", path: "ModelFile" })

export function chat(miroapi, board, content) {
    chatToJSON(content).then(data => decide(miroapi, board, data))
}

async function chatToJSON(content) {
    while (true) {
        try {
            return JSON.parse(await ollama.chat({
                model: "interpreter",
                messages: [{ role: "user", content }]
            }).then(res => res.message.content))
        } catch (err) {
            console.warn(err)
        }
    }
}

function decide(miroapi, board, data) {
    console.log(data)
    const { command, title } = data

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