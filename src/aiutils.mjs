// import { Ollama } from 'ollama'
import OpenAI from 'openai'
import fs from 'fs'
import { deleteCard } from './miroutils.mjs'
import { addCard, moveCard, renameCard } from './mirohighlevel.mjs'
import Calendar from './pipes/Calendar.mjs'
import Pipes from './utils/Pipes.mjs'
import List from './pipes/List.mjs'
import log from "./Logger.mjs"
import { Board } from '@mirohq/miro-api'

const { host, EDENAITOKEN, IMPLEMENTATION } = process.env

/**
 * @typedef {"constructCard" | "findCategories" | "checkCalendarDates" |
 * "createJSONDates" | "listOthers" | "conversationType" |
 * "augmentCalendar" | "getCrux" | "classifyItemsAsMatrix"} IMPLEMENTATION
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
}

switch (IMPLEMENTATION) {
    case "ollama":
        const ollama = {}
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
        for (const prop in system) {
            imp[prop] = createOpenAIModel(openai, system[prop])
        }
        break
    default:
        throw new Error("AI model not set")
}

const CONVOTYPES = {
    CALENDAR: "calendar",
    LIST: "list",
    UNDETERMINED: "undetermined"
}

/**
 * 
 * @param {Board} board 
 * @param {string} content 
 */
export async function chat(board, content) {
    log("DEBUG: At chat")
    console.log("Chat:", content)
    return imp.conversationType(content).then(
        /**
         * 
         * @param {keyof typeof CONVOTYPES} result 
         * @returns 
         */
        async result => {
            log("Conversation type:", result)
            return findConvoType(board, result, content)
        })
}

/**
 * 
 * @param {Board} board 
 * @param {keyof typeof CONVOTYPES} type 
 * @param {string} content 
 * @returns 
 */
async function findConvoType(board, type, content) {
    return [await pipeMapping[type]?.start(board, content) || new Pipes()]
    /**
     * @type {Pipes[]}
     */
    const arr = []
    arr.push(await Calendar.start(board, content))
    arr.push(await List.start(board, content))
    return arr
}

/**
 * @type {Partial<Record<keyof typeof CONVOTYPES, Pipes>>}
 */
const pipeMapping = {
    [CONVOTYPES.CALENDAR]: Calendar,
    [CONVOTYPES.LIST]: List
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
        messages: [{ role: "system", content: system }, { role: "user", content: `#INPUT\n${content}\n#OUTPUT` }],
    }).then(data => data.choices[0]?.message?.content ?? "")
}