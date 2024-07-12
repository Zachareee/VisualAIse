import { Board, CardItem, FrameItem, MiroApi, ShapeItem, StickyNoteItem } from "@mirohq/miro-api"
import { CardCreateRequest, FrameChanges, FrameStyle, GeometryNoRotation, Parent, PositionChange, StickyNoteCreateRequest } from "@mirohq/miro-api/dist/api.js"
import _ from "lodash"

/**
 * @typedef {{card: CardItem, sticky_note: StickyNoteItem, shape: ShapeItem, frame: FrameItem}} Filters
 */

export async function getBoards(miroapi) {
    return unwrapGenerator(miroapi.getAllBoards())
}

/**
 * 
 * @param {MiroApi} miroapi 
 * @param {string} boardId 
 * @returns 
 */
export async function getBoard(miroapi, boardId) {
    return miroapi.getBoard(boardId)
}

/**
 * 
 * @param {import("@mirohq/miro-api/dist/highlevel/Item").WidgetItem[]} board 
 * @param {import("@mirohq/miro-api/dist/highlevel/Item").WidgetItem} item 
 * @returns 
 */
export function boardContainsItem(board, item) {
    for (const widgetitem of board) {
        if (_.isEqual(widgetitem, item)) return true
    }
    return false
}

export async function createImage(miroapi, boardId, url) {
    return getBoard(miroapi, boardId).then(board => board.createImageItem({ data: { url } })).catch(console.warn)
}

/**
 * @param {Board} board
 * @param {{size: number, content: string, position: PositionChange, parent: Parent}} param2 
 */
export async function createBox(board, { size, content, position, parent }) {
    return board.createShapeItem({
        data: {
            content
        },
        geometry: {
            height: size,
            width: size
        },
        style: {
            borderOpacity: 1,
            fillOpacity: 1
        },
        position,
        parent
    })
}

/**
 * 
 * @param {Board} board 
 * @param {{title: string, bgColor: FrameStyle["fillColor"], geometry: GeometryNoRotation, position: PositionChange}} param1 
 * @returns 
 */
export async function createFrame(board, { title, bgColor: fillColor, geometry, position }) {
    return board.createFrameItem({
        data: {
            title
        },
        style: {
            fillColor
        },
        geometry,
        position
    })
}

/**
 * 
 * @param {Board} board
 * @param {Partial<Record<"description"|"title", string>>
 * & Partial<Record<"height"|"width", number>
 * & PositionChange
 * & { parent: Parent }>
 * } param1
 * @returns {Promise<CardItem>}
 */
export async function createCard(board, { description, title, height, width, x, y, parent }) {
    return board.createCardItem({
        data: {
            title, description
        },
        position: {
            x, y
        },
        geometry: {
            height, width
        },
        parent
    })
}

/**
 * 
 * @param {Board} board
 * @param {{content: string, position: PositionChange, parent?: Parent}} param1 
 * @returns {Promise<StickyNoteItem>}
 */
export async function createStickyNote(board, { content, position, parent }) {
    return board.createStickyNoteItem({
        data: { content },
        position,
        parent
    })
}

export function deleteCard(miroapi, boardId, searchKey) {
    findCardOnBoard(miroapi, boardId, searchKey).then(card => card?.delete()).catch(console.warn)
}

export function updateCard(miroapi, boardId, searchKey, data) {
    findCardOnBoard(miroapi, boardId, searchKey).then(card => card?.update(data)).catch(console.warn)
}

export function boardIsNull(board, res) {
    if (!board) res.status(401).send("Query parameter \"board\" is missing")
    return !board
}

/**
 * 
 * @param {MiroApi} miroapi 
 * @param {string} boardId 
 * @param {string} searchKey 
 * @param {keyof Filters} type
 * @returns 
 */
export async function GONES(board, searchKey, type) {
    return getBoard(miroapi, boardId).then(board => findItem(board, searchKey, type))
}

/**
 * @template {keyof Filters} T
 * @param {Board | FrameItem} board 
 * @param {T} type 
 * @returns {Promise<(Filters[T])[]>}
 */
export async function filterItems(board, type) {
    const filtered = await unwrapGenerator(board.getAllItems({ type }))
    return filtered
}

/**
 * 
 * @param {string} regex 
 * @param {string} test 
 * @returns {boolean}
 */
export function strLike(regex, test) {
    return new RegExp(`.*${regex}.*`, "i").test(test)
}

/**
 * 
 * @template {keyof Filters} T
 * @param {Board} board 
 * @param {string} searchKey 
 * @param {T} type
 * @returns {Promise<Filters[T] | void>}
 */
export async function findItem(board, searchKey, type) {
    const textLocation = findText(type)
    return (await filterItems(board, type)).find(item => strLike(searchKey, item.data[textLocation]))
}

/**
 * 
 * @param {keyof Filters} type 
 */
export function findText(type) {
    switch (type) {
        case "frame":
        case "card":
            return "title"
        case "sticky_note":
        case "shape":
            return "content"
    }
}

/**
 * 
 * @template T
 * @param {AsyncGenerator<T, void, unknown>} generator 
 */
export async function unwrapGenerator(generator) {
    const ls = []
    for await (const val of generator) {
        ls.push(val)
    }

    return ls
}
