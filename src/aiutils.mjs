import log from "./Logger.mjs"
import { Board } from '@mirohq/miro-api'
import imp from './chatmodels/Implementation.mjs'
import selectPipe from './pipes/PipelineSelector.mjs'

/**
 * The entry point to interpret the conversation
 * @param {Board} board 
 * @param {string} user 
 * @param {string} content 
 */
export async function chat(board, user, content) {
    log("DEBUG: At chat")
    console.log(`${user}: ${content}`)

    // find the conversation type
    return imp.conversationType(content).then(
        /** @param result The conversation type */
        async result => {
            log("Conversation type:", result)

            // The pipe selector function to return
            return selectPipe(board, result, user, content)
        })
}