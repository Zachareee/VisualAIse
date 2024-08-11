import OpenAIModel from './OpenAIModel.mjs'
import OllamaModel from './OllamaModel.mjs'
import ChatModel from './ChatModel.mjs'
import fs from "fs"

const { IMPLEMENTATION } = process.env

/**
 * @type {Record<string, typeof ChatModel>}
 */
const modelSelector = {
    ollama: OllamaModel,
    openai: OpenAIModel
}

/**
 * @typedef { |
 * "constructCard" | "findCategories" | "checkCalendarDates" |
 * "createJSONDates" | "listOthers" | "conversationType" | "getMonth" |
 * "augmentCalendar" | "getCrux" | "classifyItemsAsMatrix"
 * } IMPLEMENTATION
 */

/**
 * @typedef {{prompt: string, temperature: number}} SYSTEMSTRUCT
 */

/**
 * 
 * @type {Record<IMPLEMENTATION, SYSTEMSTRUCT>}
 */
const system = JSON.parse(fs.readFileSync("Prompts.json", "ascii"))

/**
 * Creates an object using the prompt identifiers as function names
 * @type {Record<Exclude<IMPLEMENTATION, "conversationType">, (message: string) => Promise<string>> & {conversationType: (message: string) => Promise<keyof typeof import("../pipes/PipelineSelector.mjs").CONVOTYPES>}}
 */
export default (() => {
    if (!IMPLEMENTATION) throw new Error("AI model not set")

    try {
        const model = new modelSelector[IMPLEMENTATION]()

        return /** @type {*} */ (Object.fromEntries(
            Object.entries(system).map(
                ([key, struct]) => [key, model.createModel(struct)]
            )
        ))
    } catch {
        throw new Error("Invalid AI model")
    }
})()