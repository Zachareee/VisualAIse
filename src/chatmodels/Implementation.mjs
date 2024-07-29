import OpenAIModel from './OpenAIModel.mjs'
import OllamaModel from './OllamaModel.mjs'
import ChatModel from './ChatModel.mjs'
import fs from "fs"

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
const system = JSON.parse(fs.readFileSync("Prompts.json", "ascii"))

/**
 * @type {Record<Exclude<IMPLEMENTATION, "conversationType">, (message: string) => Promise<string>>
 * & {conversationType: (message: string) => Promise<keyof typeof import("../pipes/PipelineSelector.mjs").CONVOTYPES>}}
 */
export default (() => {
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