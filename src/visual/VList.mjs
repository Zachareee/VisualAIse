import { Board, FrameItem } from "@mirohq/miro-api";
import { createCard, createFrame, findItem } from "../miroutils.mjs";
import { BOXSIZE, CARDHEIGHT, CARDWIDTH, listPosition } from "./Positions.mjs";
import { getLastCardByIdx, sortCards } from "../mirohighlevel.mjs";
import { PositionChange } from "@mirohq/miro-api/dist/api.js";

const MatrixFrameName = "Matrix"

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

        const sortedCards = Object.entries(await sortCards(matrix))
        if (sortedCards.length < idx + 1) { // max idx of columns is length + 1
            return addColumn(board, matrix, createdItem)
        }

        const position = getLastCardByIdx(sortedCards, idx)
        return addRow(board, matrix, position, createdItem)
    }
}

export default new VList()

/**
 * 
 * @param {Board} board 
 */
async function createMatrix(board) {
    const width = 100, height = 100

    return createFrame(board, {
        title: MatrixFrameName,
        bgColor: "#93d275",
        position: listPosition,
        geometry: { height, width }
    })
}

/**
 * 
 * @param {Board} board 
 * @param {FrameItem} matrix
 * @param {Required<PositionChange>} position 
 * @param {string} newItem 
 */
async function addRow(board, matrix, position, newItem) {
    const height = matrix.geometry?.height ?? 0
    if (height < (position.y ?? 0) + CARDHEIGHT) {
        await matrix.update({ geometry: { height: height + CARDHEIGHT } })
    }
    return proxyCreateCard(board, { title: newItem, x: position.x, y: position.y + CARDHEIGHT, parent: matrix})
}

/**
 * 
 * @param {Board} board 
 * @param {FrameItem} matrix 
 * @param {string} createdItem 
 */
async function addColumn(board, matrix, createdItem) {
    const matwidth = matrix.geometry?.width ?? 0
    const width = matwidth - matwidth % CARDWIDTH
    return matrix.update({ geometry: { width: width + CARDWIDTH } })
        .then(() => proxyCreateCard(board, { title: createdItem, x: width + CARDWIDTH / 2, y: CARDHEIGHT / 2, parent: matrix }))
}

/**
 * 
 * @param {Board} board 
 * @param {Parameters<createCard>[1]} param1 
 */
async function proxyCreateCard(board, { title, x, y, parent }) {
    return createCard(board, { title, x, y, parent, height: CARDHEIGHT })
}