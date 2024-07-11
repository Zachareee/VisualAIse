import { Board, FrameItem } from "@mirohq/miro-api"
import State from "../utils/State.mjs"
import Pipes from "../utils/Pipes.mjs"
import { imp } from "../aiutils.mjs"
import { findItem } from "../miroutils.mjs"
import { FrameChanges } from "@mirohq/miro-api/dist/api.js"

/**
 * @type {string[]}
 */
const originalConvoState = []
const convo = new State(originalConvoState)

// /**
//  * @type {State<string[][]>}
//  */
// const matrix = new State([])

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
    const items = await imp.getCrux(content)
        .then(item => convo.getValue()
            .then(arr => [...arr, item]))
    console.log("Convo array is currently:", items)
    convo.setValue(items)
    imp.getMatrixDimensions(JSON.stringify(items)).then(
        value => console.log("Dimensions for this are", value)
    )
    return
    // await convo.setValue(
    //     await convo.getValue()
    //         .then(arr => arr.push(items))
    //         .then(arr => imp.getMatrixDimensions(JSON.stringify(arr)))
    //         .then(console.log)
    // )
}

export default new List()