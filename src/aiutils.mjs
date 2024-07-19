import fs from 'fs'
import { deleteCard } from './miroutils.mjs'
import { addCard, moveCard, renameCard } from './mirohighlevel.mjs'
import Calendar from './pipes/Calendar.mjs'
import Pipes from './utils/Pipes.mjs'
import List from './pipes/List.mjs'
import log from "./Logger.mjs"
import { Board } from '@mirohq/miro-api'
import OpenAIModel from './chatmodels/OpenAIModel.mjs'
import OllamaModel from './chatmodels/OllamaModel.mjs'
import ChatModel from './chatmodels/ChatModel.mjs'

const { EDENAITOKEN, IMPLEMENTATION } = process.env

/**
 * @typedef {"constructCard" | "findCategories" | "checkCalendarDates" |
 * "createJSONDates" | "listOthers" | "conversationType" |
 * "augmentCalendar" | "getCrux" | "classifyItemsAsMatrix"} IMPLEMENTATION
 */

/**
 * @typedef {{prompt: string, temperature: number}} SYSTEMSTRUCT
 */

/**
 * 
 * @type {Record<IMPLEMENTATION, SYSTEMSTRUCT>}
 */
const system = JSON.parse(fs.readFileSync("System.json", "ascii"))

/**
 * @type {Record<Exclude<IMPLEMENTATION, "conversationType">, (message: string) => Promise<string>>
 * & {conversationType: (message: string) => Promise<keyof typeof CONVOTYPES>}}
 */
export const imp = (() => {
    /**
     * @type {ChatModel}
     */
    const model = (() => {
        switch (IMPLEMENTATION) {
            case "ollama":
                return new OllamaModel()
            case "openai":
                return new OpenAIModel()
            default:
                throw new Error("AI model not set")
        }
    })()

    /**
     * @type {object}
     */
    const imp = {}
    for (const prop in system) {
        const property = /** @type {IMPLEMENTATION} */ (prop)
        imp[property] = model.createModel(system[property])
    }
    return imp
})()

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