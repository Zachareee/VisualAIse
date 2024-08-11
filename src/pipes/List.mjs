import { Board } from "@mirohq/miro-api"
import State from "../State.mjs"
import Pipes from "./Pipes.mjs"
import imp from "../chatmodels/Implementation.mjs"
import VList from "../visual/VList.mjs"
import log from "../Logger.mjs"

/**
 * @type {string[]}
 */
const originalConvoState = []
/**
 * A in-memory state for the pipeline to catch prior processed messages
 */
const convo = new State(originalConvoState)

/**
 * The list pipeline which encapsulates most of the processing logic
 */
class List extends Pipes {
    /**
     * 
     * @param {Board} board 
     * @param {string} user 
     * @param {string} content 
     */
    async start(board, user, content) {
        this.output = true

        await decideMatrix(board, user, content)
        return this
    }

    async finish() {
        if (this.output) {
            this.output = false
            const value = `Final Matrix is\n${(await convo.getValue()).join("\n")}`
            log(value)
            convo.setValue(originalConvoState)
            return value
        }
    }
}

/**
 * 
 * @param {Board} board 
 * @param {string} user 
 * @param {string} content 
 */
async function decideMatrix(board, user, content) {
    const newitem = JSON.parse(await imp.getCrux(content))
    const items = await convo.getValue().then(arr => [...arr, ...newitem])
    log("Convo array is currently:", items)
    convo.setValue(items)

    return imp.classifyItemsAsMatrix(JSON.stringify(items)).then(
        value => {
            /**
             * @type {string[][]}
             */
            const graph = JSON.parse(value)
            log("The graph is", graph)
            return VList.prepareList(board, user, graph)
        }
    )
}

export default new List()