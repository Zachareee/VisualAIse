import { imp } from "../AIutils.mjs";
import _ from "lodash"
import Pipes from "./Pipes.mjs";
import State from "../State.mjs";
import VCalendar from "../visual/VCalendar.mjs";
import log from "../Logger.mjs"
import { Board } from "@mirohq/miro-api";

/**
 * @type {Record<string, string>}
 */
const originalState = {}
const state = new State(originalState)
/**
 * @type {Date}
 */
export let date

class Calendar extends Pipes {
    /**
     * 
     * @param {Board} board 
     * @param {string} user 
     * @param {string} content 
     */
    async start(board, user, content) {
        this.output = true

        await decideCalendar(board, user, content)
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
 * @param {string} user 
 * @param {string} content 
 */
async function decideCalendar(board, user, content) {
    return imp.checkCalendarDates(content).then(async result => {
        log("Calendar dates found for", content, result)
        if (!date) {
            const newDate = new Date()
            date = new Date(`1 ${await imp.getMonth(content)} ${newDate.getFullYear()} UTC`)
        }
        if (Boolean(result))
            return imp.createJSONDates(content)
                .then(JSON.parse).then(
                    /**
                     * @param {Record<string, string[]>} JSONarr
                     */
                    JSONarr => {
                        log("JSON format of dates:", JSONarr)
                        return addDatesToBoard(board, user, JSONarr)
                    }
                )
    })
}

/**
 * 
 * @param {Board} board 
 * @param {string} user
 * @param {Record<string, string[]>} array 
 */
async function addDatesToBoard(board, user, array) {
    await VCalendar.prepareCalendar(board, user, array)
    return imp.augmentCalendar(`Existing:${JSON.stringify(await state.getValue())}\nNew:${JSON.stringify(array)}`)
        .then(result => {
            log("Result of augmenting is", result)
            return state.setValue(JSON.parse(result))
        })
}
