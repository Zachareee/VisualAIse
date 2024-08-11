import imp from "../chatmodels/Implementation.mjs";
import _ from "lodash"
import Pipes from "./Pipes.mjs";
import State from "../State.mjs";
import VCalendar from "../visual/VCalendar.mjs";
import log from "../Logger.mjs"
import { Board } from "@mirohq/miro-api";

/** @typedef {Record<string, string[]>} CalendarStruct */

/**
 * @type {CalendarStruct}
 */
const originalState = {}

/**
 * The internal state of the Calendar as a JSON object, with the date as the key and the events as values
 * {"16": ["Birthday party"], "21": ["Project deadline", "Meeting with clients"]}
 */
const state = new State(originalState)
/**
 * @type {Date}
 */
export let date

/**
 * The calendar pipeline which exposes starting point functions, and can provide prior instructions as context
 */
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
 * Gets triggered immediately after starting
 * @param {Board} board 
 * @param {string} user 
 * @param {string} content 
 */
async function decideCalendar(board, user, content) {
    return imp.checkCalendarDates(content)
        .then(
            Boolean
        ).then(
            /**
             * @param result A boolean result for whether a calendar date was found
             */
            async result => {
                log("Calendar dates found for", content, result)
                if (!result) return

                // set up the month in the variable "date", which helps to align the calendar
                if (!date) {
                    const newDate = new Date()
                    date = new Date(`1 ${await imp.getMonth(content)} ${newDate.getFullYear()} UTC`)
                }

                return imp.createJSONDates(content).then(
                    JSON.parse
                ).then(
                    /**
                     * @param {CalendarStruct} JSONarr An object with a structure similar to {@link state}
                     */
                    JSONarr => {
                        log("JSON format of dates:", JSONarr)
                        return addDatesToBoard(board, user, JSONarr)
                    }
                )
            })
}

/**
 * Calls on the visual counterpart of this pipeline and augments the internal view of the calendar
 * @param {Board} board 
 * @param {string} user
 * @param {CalendarStruct} array 
 */
async function addDatesToBoard(board, user, array) {
    await VCalendar.prepareCalendar(board, user, array)
    return augmentCalendar(array)
        .then(
            JSON.parse
        ).then(
            /**
             * 
             * @param {CalendarStruct} result 
             */
            result => {
                log("Result of augmenting is", result)
                return state.setValue(result)
            }
        )
}

/**
 * Shortened function to augment the calendar
 * @param {CalendarStruct} array 
 */
async function augmentCalendar(array) {
    const { stringify: s } = JSON // Extracts the stringify function to shorten the line below
    // Get AI to augment the calendar for us
    return imp.augmentCalendar(`Existing:${s(await state.getValue())}\nNew:${s(array)}`)
}