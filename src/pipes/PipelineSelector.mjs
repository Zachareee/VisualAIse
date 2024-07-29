import { Board } from "@mirohq/miro-api"
import Pipes from "./Pipes.mjs"
import Calendar from "./Calendar.mjs"
import List from "./List.mjs"

export const CONVOTYPES = {
    CALENDAR: "calendar",
    LIST: "list",
    UNDETERMINED: "undetermined"
}

/**
 * @type {Partial<Record<keyof typeof CONVOTYPES, Pipes>>}
 */
const pipeMapping = {
    [CONVOTYPES.CALENDAR]: Calendar,
    [CONVOTYPES.LIST]: List
}

/**
 * 
 * @param {Board} board 
 * @param {keyof typeof CONVOTYPES} type 
 * @param {string} user 
 * @param {string} content 
 * @returns 
 */
async function selectPipe(board, type, user, content) {
    return [await pipeMapping[type]?.start(board, user, content) || new Pipes()]
    /**
     * @type {Pipes[]}
     */
    const arr = []
    arr.push(await Calendar.start(board, user, content))
    arr.push(await List.start(board, user, content))
    return arr
}

export default selectPipe