import { Ollama } from 'ollama'
import OpenAI from 'openai'
import fs from 'fs'
import { deleteCard} from './miroutils.mjs'
import { addCard, moveCard, renameCard } from './mirohighlevel.mjs'
import { calendar } from './pipelines/calendar.mjs'

const DEBUG = true
const log = DEBUG ? console.log : () => { }
const { host, EDENAITOKEN, IMPLEMENTATION } = process.env

/**
 * @typedef {"constructCard" | "findCategories" | "checkCalendarDates" | "createJSONDates" | "listOthers" | "conversationType"} IMPLEMENTATION
 */

/**
 * 
 * @returns {Record<IMPLEMENTATION, string>}
 */
function readSystem() {
    return JSON.parse(fs.readFileSync("System.json", "ascii"))
}

/**
 * @type {Record<IMPLEMENTATION, (message: string) => Promise<string>>}
 */
export const imp = {
    constructCard: async msg => msg,
    findCategories: async msg => msg,
    checkCalendarDates: async msg => msg,
    createJSONDates: async msg => msg,
    listOthers: async msg => msg,
    conversationType: async msg => msg
}

const CONVOTYPES = {
    CALENDAR: "calendar",
    TASKLIST: "tasklist",
    UNDETERMINED: "undetermined"
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
        const system = readSystem()
        for (const prop in imp) {
            imp[prop] = createOpenAIModel(openai, system[prop])
        }
        break
    default:
        throw new Error("AI model not set")
}

/**
 * 
 * @param {Board} board 
 * @param {string} content 
 */
export async function chat(board, content) {
    log("DEBUG: At chat")
    await imp.conversationType(content).then(
        async result => {
            log("Conversation type:", result)
            switch (result) {
                case CONVOTYPES.CALENDAR:
                    await calendar(board, content)
                    break
                case CONVOTYPES.TASKLIST:
                    break
            }
        })
}

export function decide(miroapi, board, data, clusters, sortedCards) {
    const { command, title, newTitle, owner, categories } = data
    const arr = clusters[categories.indexOf(owner)]
    log(clusters, categories, owner)
    const newOwner = arr[Math.floor(Math.random() * arr.length)]

    switch (command) {
        case "addCard":
            addCard(miroapi, board, { ...data, owner: newOwner }, sortedCards)
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
    }).then(res => res.json()).catch(console.warn)
    log(res)
    log(res.items[0].image_resource_url)
    return res
}

/**
 * 
 * @param {OpenAI} openai 
 * @param {string} system 
 * @returns {(content: string) => Promise<string>}
 */
function createOpenAIModel(openai, system) {
    return content => openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: system + "\n#INPUT" }, { role: "user", content: content + "\n#OUTPUT" }]
    }).then(data => data.choices[0]?.message?.content)
}