import { Board } from "@mirohq/miro-api/dist/api.js";

/**
 * A superclass which all pipelines will extend from
 */
export default class Pipes {
    /**
     * 
     * @param {Board} board 
     * @param {string} user 
     * @param {string} content 
     */
    async start(board, user, content) {
        return this
    }
    /**
     * @returns {Promise<any>}
     */
    async finish() {}
}