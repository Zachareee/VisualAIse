import { Board, CardItem, FrameItem } from "@mirohq/miro-api";
import { createCard, createFrame, createTag, filterItems, findItem, strLike, updateFrameGeo } from "../miroutils.mjs";
import { CARDHEIGHT, CARDWIDTH, coordinateCalculator, listPosition } from "./Positions.mjs";
import log from "../Logger.mjs"
import { GeometryNoRotation } from "@mirohq/miro-api/dist/api.js";

/** The name of the Matrix frame */
const MatrixFrameName = "Matrix"

/** The visual counterpart of the List */
class VList {
    /**
     * 
     * @param {Board} board 
     * @param {string} user
     * @param {string[][]} graph 
     */
    async prepareList(board, user, graph) {
        // Finds the matrix frame, if it does not exist, create it
        /** The matrix frame */
        const matrix = (await findItem(board, MatrixFrameName, "frame"))
            || (await createMatrix(board))

        // Expands the frame to accomodate the maximum length and width of both frames
        await expandFrame(matrix, graph)
        log("expandFrame done")

        // Find all card items in the matrix
        await filterItems(matrix, "card").then(
            // wait for all the cards to shift
            cards => Promise.all(graph.map(
                // each titleArr are in a column
                async (titleArr, x) => {
                    // for each card in the column
                    for (const idx in titleArr) {
                        const y = Number(idx)
                        // find card from array
                        const card = findAndPopCard(cards, titleArr[y])
                        // if card not found (meaning new card)
                        if (!card) {
                            // create card and continue the loop
                            await addCardToMatrix(board, user, {
                                geometry: cardDefaults,
                                position: calculatePosition(x, y),
                                title: titleArr[y],
                                parent: matrix
                            })
                            continue
                        }

                        // move the card if it exists
                        await card.update({ position: calculatePosition(x, y) })
                    }
                })
            ))
        // shrink frame to min size
        return shrinkFrame(matrix, graph)
    }
}

export default new VList()

/**
 * Creates a card and adds it to the matrix with a tag
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
 * Expand frame to the maximum dimensions of the current frame required by the graph and the previous frame
 * It is done this way instead of tightly wrapping the graph to prevent existing cards from being orphaned which can cause errors
 * @param {FrameItem} frame 
 * @param {string[][]} graph 
 */
async function expandFrame(frame, graph) {
    const framewidth = frame.geometry?.width ?? 0, frameheight = frame.geometry?.height ?? 0

    // get max width and height
    const width = Math.max(CARDWIDTH * graph.length, framewidth)
    const height = Math.max(CARDHEIGHT * graph.map(arr => arr.length).reduce((num1, num2) => Math.max(num1, num2)), frameheight)

    log(`Expanding, width: ${width}, height: ${height}`)
    return updateFrameGeo(frame, { width, height })
}

/**
 * Shrinks the frame to the current graph size
 * This should only be used once the program is certain that there are no cards that can be orphaned
 * @param {FrameItem} frame 
 * @param {string[][]} graph 
 */
async function shrinkFrame(frame, graph) {
    const width = CARDWIDTH * graph.length
    const height = CARDHEIGHT * graph.map(arr => arr.length).reduce((num1, num2) => Math.max(num1, num2))

    log(`Shrinking, width: ${width}, height: ${height}`)
    return updateFrameGeo(frame, { width, height })
}

/**
 * Finds the card in the {@link cardItems} array and removes it
 * This helps to reduce search times
 * @param {CardItem[]} cardItems 
 * @param {string} title 
 */
function findAndPopCard(cardItems, title) {
    // finds the index of the card
    const idx = cardItems.findIndex(card => strLike(title, card.data?.title ?? ""))

    // if card not found, return nothing
    if (idx === -1) return

    // if card is found, return the card and remove it from the array
    return cardItems.splice(idx, 1)[0]
}

/**
 * Creates the matrix frame
 * @param {Board} board 
 */
async function createMatrix(board) {
    return createFrame(board, {
        title: MatrixFrameName,
        bgColor: "#93d275",
        position: listPosition
    })
}

/** Calculates the coordinate of the sticky note based on x and y coordinates */
const calculatePosition = coordinateCalculator({ height: CARDHEIGHT, width: CARDWIDTH })

/**
 * Default size of cards
 * @type {Required<GeometryNoRotation>}
 */
const cardDefaults = { width: CARDWIDTH, height: CARDHEIGHT }