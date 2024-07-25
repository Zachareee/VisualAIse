import fs from 'fs'
import Calendar from './pipes/Calendar.mjs'
import Pipes from './pipes/Pipes.mjs'
import List from './pipes/List.mjs'
import log from "./Logger.mjs"
import { Board } from '@mirohq/miro-api'
import OpenAIModel from './chatmodels/OpenAIModel.mjs'
import OllamaModel from './chatmodels/OllamaModel.mjs'
import ChatModel from './chatmodels/ChatModel.mjs'

const { IMPLEMENTATION } = process.env

/**
 * @typedef {"constructCard" | "findCategories" | "checkCalendarDates" |
 * "createJSONDates" | "listOthers" | "conversationType" | "getMonth" |
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


    return /** @type {*} */ (Object.fromEntries(
        Object.entries(system).map(
            ([key, struct]) => [key, model.createModel(struct)]
        )
    ))
})()

const CONVOTYPES = {
    CALENDAR: "calendar",
    LIST: "list",
    UNDETERMINED: "undetermined"
}

/**
 * 
 * @param {Board} board 
 * @param {string} user 
 * @param {string} content 
 */
export async function chat(board, user, content) {
    log("DEBUG: At chat")
    console.log(`${user}: ${content}`)
    return imp.conversationType(content).then(
        async result => {
            log("Conversation type:", result)
            return findConvoType(board, result, user, content)
        })
}

/**
 * 
 * @param {Board} board 
 * @param {keyof typeof CONVOTYPES} type 
 * @param {string} user 
 * @param {string} content 
 * @returns 
 */
async function findConvoType(board, type, user, content) {
    return [await pipeMapping[type]?.start(board, user, content) || new Pipes()]
    /**
     * @type {Pipes[]}
     */
    const arr = []
    arr.push(await Calendar.start(board, user, content))
    arr.push(await List.start(board, user, content))
    return arr
}

/**
 * @type {Partial<Record<keyof typeof CONVOTYPES, Pipes>>}
 */
const pipeMapping = {
    [CONVOTYPES.CALENDAR]: Calendar,
    [CONVOTYPES.LIST]: List
}