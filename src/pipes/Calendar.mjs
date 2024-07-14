import { imp } from "../aiutils.mjs";
import _ from "lodash"
import Pipes from "../utils/Pipes.mjs";
import State from "../utils/State.mjs";
import VCalendar from "../visual/VCalendar.mjs";
import log from "../Logger.mjs"
import { Board } from "@mirohq/miro-api";

/**
 * @type {Record<string, string>}
 */
const originalState = {}
const state = new State(originalState)

class Calendar extends Pipes {
    /**
     * 
     * @param {Board} board 
     * @param {string} content 
     */
    async start(board, content) {
        this.output = true

        await decideCalendar(board, content)
        return this
    }

    async finish() {
        if (this.output) {
            this.output = false
            const value = `Final Calendar is ${JSON.stringify(await state.getValue())}`
            state.setValue(originalState)
            log(value)
            return value
        }
    }
}

export default new Calendar()

/**
 * 
 * @param {Board} board 
 * @param {string} content 
 */
async function decideCalendar(board, content) {
    return imp.checkCalendarDates(content).then(async result => {
        log("Calendar dates found for", content, result)
        if (Boolean(result))
            return imp.createJSONDates(content)
                .then(JSON.parse).then(
                    /**
                     * @param {Record<string, string[]>} JSONarr
                     */
                    JSONarr => {
                        log("JSON format of dates:", JSONarr)
                        return addDatesToBoard(board, JSONarr)
                    }
                )
    })
}

/**
 * 
 * @param {Board} board 
 * @param {Record<string, string[]>} array 
 */
async function addDatesToBoard(board, array) {
    await VCalendar.prepareCalendar(board, array)
    return imp.augmentCalendar(`Existing:${JSON.stringify(await state.getValue())}\nNew:${JSON.stringify(array)}`)
        .then(result => {
            log("Result of augmenting is", result)
            return state.setValue(JSON.parse(result))
        })
}
