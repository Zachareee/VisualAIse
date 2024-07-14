import { Board, FrameItem } from "@mirohq/miro-api"
import State from "../utils/State.mjs"
import Pipes from "../utils/Pipes.mjs"
import { imp } from "../aiutils.mjs"
import VList from "../visual/VList.mjs"

/**
 * @type {string[]}
 */
const originalConvoState = []
const convo = new State(originalConvoState)

class List extends Pipes {
    /**
     * 
     * @param {Board} board 
     * @param {string} content 
     */
    async start(board, content) {
        this.output = true

        await decideMatrix(board, content)
        return this
    }

    async finish() {
        if (this.output) {
            this.output = false
            const value = `Final Matrix is\n${(await convo.getValue()).join("\n")}`
            console.log(value)
            convo.setValue(originalConvoState)
            return value
        }
    }
}

/**
 * 
 * @param {Board} board 
 * @param {string} content 
 */
async function decideMatrix(board, content) {
    const newitem = JSON.parse(await imp.getCrux(content))
    const items = await convo.getValue().then(arr => [...arr, ...newitem])
    console.log("Convo array is currently:", items)
    convo.setValue(items)

    return imp.classifyItemsAsMatrix(JSON.stringify(items)).then(
        value => {
            /**
             * @type {string[][]}
             */
            const graph = JSON.parse(value)
            console.log("The graph is", graph)
            return VList.prepareList(board, graph)
        }
    )
}

export default new List()