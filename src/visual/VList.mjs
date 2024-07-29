import { Board, CardItem, FrameItem } from "@mirohq/miro-api";
import { createCard, createFrame, createTag, filterItems, findItem, strLike } from "../miroutils.mjs";
import { CARDHEIGHT, CARDWIDTH, coordinateCalculator, listPosition } from "./Positions.mjs";
import log from "../Logger.mjs"

const MatrixFrameName = "Matrix"

class VList {
    /**
     * 
     * @param {Board} board 
     * @param {string} user
     * @param {string[][]} graph 
     */
    async prepareList(board, user, graph) {
        const matrix = (await findItem(board, MatrixFrameName, "frame"))
            || (await createMatrix(board))

        await expandFrame(matrix, graph)
        log("expandFrame done")

        await filterItems(matrix, "card").then(
            cards => Promise.all(graph.map(
                async (titleArr, x) => {
                    for (const idx in titleArr) {
                        const y = Number(idx)
                        const card = findAndPopCard(cards, titleArr[y])
                        if (!card) {
                            await addCardToMatrix(board, user, {
                                geometry: cardDefaults,
                                position: calculatePosition(x, y),
                                title: titleArr[y],
                                parent: matrix
                            })
                            continue
                        }
                        await changePosition(card, { x, y })
                    }
                })
            ))
        await shrinkFrame(matrix, graph)
    }
}

export default new VList()

/**
 * 
 * @param {Board} board 
 * @param {string} title 
 * @param {Parameters<import('../miroutils.mjs').createCard>[1]} params 
 */
async function addCardToMatrix(board, title, params) {
    return createTag(board, { title }).then(
        ({ id }) => createCard(board, params).then(
            card => card.attachTag(id)
        )
    )
}

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
    const height = Math.max(CARDHEIGHT * graph.map(arr => arr.length).reduce((num1, num2) => Math.max(num1, num2)), 100)

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
 * @param {Record<"x"|"y", number>} param1
 */
async function changePosition(card, { x, y }) {
    return card.update({ position: calculatePosition(x, y) })
}

const calculatePosition = coordinateCalculator({height: CARDHEIGHT, width: CARDWIDTH})

const cardDefaults = { width: CARDWIDTH, height: CARDHEIGHT }