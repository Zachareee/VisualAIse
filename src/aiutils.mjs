import log from "./Logger.mjs"
import { Board } from '@mirohq/miro-api'
import imp from './chatmodels/Implementation.mjs'
import selectPipe from './pipes/PipelineSelector.mjs'

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
            return selectPipe(board, result, user, content)
        })
}