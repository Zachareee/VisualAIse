import { Ollama } from 'ollama'
import OpenAI from 'openai'
import fs from 'fs'
import { deleteCard, getItems } from './miroutils.mjs'
import { sortCards, addCard, moveCard, renameCard } from './mirohighlevel.mjs'
import { findClusters } from './clustering.mjs'
import { log, warn } from 'console'

const { host, EDENAITOKEN, IMPLEMENTATION } = process.env

const imp = {
    constructCard: async () => ({ command: "doNothing" })
}

function readFile() {
    return fs.readFileSync("System.txt", "ascii")
}

switch (IMPLEMENTATION) {
    case "ollama":
        const ollama = new Ollama({ host })
        const model = "interpreter"
        await ollama.create({ model, path: "ModelFile" })
        imp.constructCard = async content => ollama.chat({
            model,
            messages: [{ role: "user", content }]
        }).then(res => res.message.content)
        break
    case "openai":
        const openai = new OpenAI()
        const system = readFile()
        imp.findCategories = async (content, role = "user") => openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "Based on the INPUT groups of JSON arrays, reply with a JSON array, replacing each INPUT group with a single category" }, { role, content }]
        }).then(data => data.choices[0]?.message?.content)
        imp.constructCard = async (content, role = "user") => openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: system }, { role, content }]
        }).then(data => data.choices[0]?.message?.content)
        break
}

export async function chat(miroapi, board, content) {
    const sortedCards = await sortCards(miroapi, board)
    // const categories = getCategoryNames(sortedCards)
    chatToJSON(content, await imp.findCategories(JSON.stringify(findClusters(await getItems(miroapi, board)))))
        .then(data => data.length ? data.forEach(obj => decide(miroapi, board, obj, sortedCards))
            : decide(miroapi, board, data, sortedCards))
}

async function chatToJSON(content, categories) {
    while (true) {
        try {
            log(categories)
            content = "CATEGORIES: " + categories + "\n" + content
            const result = await imp.constructCard(content)
            log(result)
            // fs.writeFileSync("result.txt", result)
            return {...JSON.parse(result), categories}
        } catch (err) {
            warn(err)
            return
        }
    }
}

export function decide(miroapi, board, data, sortedCards) {
    log(data)
    const { command, title, newTitle, owner, categories } = data

    switch (command) {
        case "addCard":
            addCard(miroapi, board, data, categories)
            break
        case "removeCard":
            deleteCard(miroapi, board, title)
            break
        case "moveCard":
            moveCard(miroapi, board, data, sortedCards)
            break
        case "renameCard":
            renameCard(miroapi, board, data, sortedCards)
            break
        default:
            log("default")
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
    }).then(res => res.json()).catch(warn)
    log(res)
    log(res.items[0].image_resource_url)
    return res
}