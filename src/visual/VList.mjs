import { Board, FrameItem } from "@mirohq/miro-api";
import { createCard, createFrame, findItem } from "../miroutils.mjs";
import { listPosition } from "./Positions.mjs";
import { getLastCardByIdx, sortCards } from "../mirohighlevel.mjs";
import { PositionChange } from "@mirohq/miro-api/dist/api.js";

const MatrixFrameName = "Matrix"
const CARDWIDTH = 320, CARDHEIGHT = 60

class VList {
    /**
     * 
     * @param {Board} board 
     * @param {string} createdItem 
     * @param {number} idx 
     */
    async prepareList(board, createdItem, idx) {
        const matrix = (await findItem(board, MatrixFrameName, "frame"))
            || (await createMatrix(board))

        await sortCards(matrix).then(
            sortedCards => getLastCardByIdx(sortedCards, idx)
        ).then(
            position => extendFrame(board, matrix, position, createdItem)
        )
        return
    }
}

export default new VList()

/**
 * 
 * @param {Board} board 
 */
async function createMatrix(board) {
    const width = Math.max(CARDWIDTH, 100), height = Math.max(CARDHEIGHT, 100)

    return createFrame(board, {
        title: MatrixFrameName,
        bgColor: "#ffcee0",
        position: listPosition,
        geometry: { height, width }
    })
}

/**
 * 
 * @param {Board} board 
 * @param {FrameItem} matrix
 * @param {PositionChange} position 
 * @param {string} newItem 
 */
async function extendFrame(board, matrix, position, newItem) {
    const height = matrix.geometry?.height ?? 0
    if (height < (position.y ?? 0) + 0.5 * CARDHEIGHT) {
        matrix.update({ geometry: { height: height + CARDHEIGHT } })
    }
    return createCard(board, { title: newItem, x: position.x, y: position.y, parent: matrix })
}
