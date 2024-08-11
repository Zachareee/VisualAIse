import { Board } from "@mirohq/miro-api"
import Pipes from "./Pipes.mjs"
import Calendar from "./Calendar.mjs"
import List from "./List.mjs"

/**
 * A listing of visualisation models based on the conversationType in Prompts.json
 */
export const CONVOTYPES = {
    CALENDAR: "calendar",
    LIST: "list",
    UNDETERMINED: "undetermined"
}

/**
 * Mapping of {@link CONVOTYPES} to {@link Pipes}
 * @type {Partial<Record<keyof typeof CONVOTYPES, Pipes>>}
 */
const pipeMapping = {
    [CONVOTYPES.CALENDAR]: Calendar,
    [CONVOTYPES.LIST]: List
}

/**
 * Logic to select the pipe to be used, comment out the first line to allow fallthrough logic
 * @param {Board} board 
 * @param {keyof typeof CONVOTYPES} type 
 * @param {string} user 
 * @param {string} content 
 * @returns 
 */
async function selectPipe(board, type, user, content) {
    return [await pipeMapping[type]?.start(board, user, content) || new Pipes()]
    return Promise.all(Object.values(pipeMapping).map(
        pipe => pipe.start(board, user, content)
    ))
}

export default selectPipe