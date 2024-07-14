import { Board, CardItem, FrameItem } from "@mirohq/miro-api";
import { createCard, createFrame, filterItems, findItem, strLike } from "../miroutils.mjs";
import { CARDHEIGHT, CARDWIDTH, listPosition } from "./Positions.mjs";
import log from "../Logger.mjs"

const MatrixFrameName = "Matrix"

class VList {
    /**
     * 
     * @param {Board} board 
     * @param {string[][]} graph 
     */
    async prepareList(board, graph) {
        const matrix = (await findItem(board, MatrixFrameName, "frame"))
            || (await createMatrix(board))

        await expandFrame(matrix, graph)
        log("expandFrame done")

        await filterItems(matrix, "card").then(
            cards => Promise.all(graph.map(
                (titleArr, row) => Promise.all(titleArr.map(
                    async (title, column) => {
                        const card = findAndPopCard(cards, title)
                        if (!card) return createCard(board, { ...cardDefaults, ...calculatePosition(column, row), title, parent: matrix })
                        return changePosition(card, { column, row })
                    }
                ))
            ))
        )
        await shrinkFrame(matrix, graph)
    }
}

export default new VList()

/**
 * 
 * @param {FrameItem} frame 
 * @param {string[][]} graph 
 */
async function expandFrame(frame, graph) {
    const framewidth = frame.geometry?.width ?? 0, frameheight = frame.geometry?.height ?? 0
    const width = Math.max(CARDWIDTH * graph.length, framewidth)
    const height = Math.max(CARDHEIGHT * graph.map(arr => arr.length).reduce((num1, num2) => Math.max(num1, num2)), frameheight)

    log(`Expanding, width: ${width}, height: ${height}`)
    return frame.update({ geometry: { width, height } })
}

/**
 * 
 * @param {FrameItem} frame 
 * @param {string[][]} graph 
 */
async function shrinkFrame(frame, graph) {
    const width = CARDWIDTH * graph.length
    const height = CARDHEIGHT * graph.map(arr => arr.length).reduce((num1, num2) => Math.max(num1, num2))

    log(`Shrinking, width: ${width}, height: ${height}`)
    return frame.update({ geometry: { width, height } })
}

/**
 * 
 * @param {CardItem[]} cardItems 
 * @param {string} title 
 */
function findAndPopCard(cardItems, title) {
    const idx = cardItems.findIndex(card => strLike(title, card.data?.title ?? ""))
    if (idx === -1) return

    return cardItems.splice(idx, 1)[0]
}

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
 * @param {CardItem} card 
 * @param {Record<"column"|"row", number>} param1
 */
async function changePosition(card, { column, row }) {
    return card.update({ position: calculatePosition(column, row) })
}

/**
 * 
 * @param {number} column 
 * @param {number} row 
 */
function calculatePosition(column, row) {
    return { x: CARDWIDTH * (row + 0.5), y: CARDHEIGHT * (column + 0.5) }
}

const cardDefaults = { width: CARDWIDTH, height: CARDHEIGHT }