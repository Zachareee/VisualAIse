import { Board, FrameItem } from "@mirohq/miro-api"
import State from "../utils/State.mjs"
import Pipes from "../utils/Pipes.mjs"
import { imp } from "../aiutils.mjs"
import { findItem } from "../miroutils.mjs"
import { FrameChanges } from "@mirohq/miro-api/dist/api.js"

const originalConvoState = []
/**
 * @type {State<string[]>}
 */
const convo = new State(originalConvoState)

/**
 * @type {State<string[][]>}
 */
const matrix = new State([])
const MatrixFrameName = "Matrix"

class List extends Pipes {
    /**
     * 
     * @param {Board} board 
     * @param {string} content 
     */
    async start(board, content) {
        this.output = true
        const matrix = (await findItem(board, MatrixFrameName, FrameChanges.TypeEnum.Freeform))
            || (await createMatrix(board))

        await decideMatrix(board, content, matrix)
        return this
    }

    async finish() {
        if (this.output) {
            this.output = false
            console.log("Final Matrix is", await convo.getValue())
            convo.setValue(originalConvoState)
        }
    }
}

/**
 * 
 * @param {Board} board 
 * @param {string} content 
 * @param {FrameItem} frame 
 */
async function decideMatrix(board, content, frame) {
    const item = await imp.getCrux(content)
        .then(item => convo.getValue()
            .then(arr => [...arr, item]))
    console.log("Convo array is currently:", item)
    return convo.setValue(item)
    await convo.setValue(
        await convo.getValue()
            .then(arr => arr.push(item))
            .then(arr => imp.checkMatrixDimensions(JSON.stringify(arr)))
            .then(console.log)
    )
}

/**
 * 
 * @param {Board} board 
 */
async function createMatrix(board) { }

export default new List()