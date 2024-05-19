import { Ollama } from 'ollama'
import { deleteCard } from './miroutils.mjs'
import { sortCards, getCategoryNames, addCard, moveCard, renameCard } from './mirohighlevel.mjs'

const model = "interpreter"

const { host, EDENAITOKEN } = process.env

const ollama = new Ollama({ host })
await ollama.create({ model, path: "ModelFile" })

export async function chat(miroapi, board, content) {
    const sortedCards = await sortCards(miroapi, board)
    const categories = getCategoryNames(sortedCards)
    chatToJSON(content, categories).then(data => data.forEach(obj => decide(miroapi, board, obj, sortedCards)))
}

async function chatToJSON(content, categories) {
    while (true) {
        try {
            // console.log(content, categories)
            content = JSON.stringify(categories) + "\n" + content
            const res = JSON.parse(await ollama.chat({
                model,
                messages: [{ role: "user", content }]
            }).then(res => res.message.content))

            console.log(res)
            if (!res.length) throw new Error("Not an array")
            return res
        } catch (err) {
            console.warn(err)
        }
    }
}

export function decide(miroapi, board, data, sortedCards) {
    console.log(data)
    const { command, title, newTitle, owner } = data

    switch (command) {
        case "addCard":
            addCard(miroapi, board, { title, owner }, sortedCards)
            break
        case "removeCard":
            deleteCard(miroapi, board, title)
            break
        case "moveCard":
            moveCard(miroapi, board, { title, owner }, sortedCards)
            break
        case "renameCard":
            renameCard(miroapi, board, { title, newTitle }, sortedCards)
            break
        default:
            console.log("default")
    }
}

export async function generateImage(text) {
    const provider = "replicate/classic"
    const res = await fetch("https://api.edenai.run/v2/image/generation", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${EDENAITOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            providers: provider,
            text,
            resolution: "256x256",
        })
    }).then(res => res.json())
    console.log(res)
    console.log(res[provider].items[0].image_resource_url)
    return res
}