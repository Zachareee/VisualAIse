import { Board, CardItem, FrameItem, MiroApi, ShapeItem, StickyNoteItem } from "@mirohq/miro-api"
import { CardCreateRequest, FrameChanges, FrameStyle, GeometryNoRotation, PositionChange, StickyNoteCreateRequest } from "@mirohq/miro-api/dist/api.js"

/**
 * @typedef {{card: CardItem, sticky_note: StickyNoteItem, shape: ShapeItem, [FrameChanges.TypeEnum.Freeform]: FrameItem}} Filters
 */

/**
 * @typedef {{
 * card: FilterInfo<CardItem, "title">,
 * sticky_note: FilterInfo<StickyNoteItem, "content">,
 * shape: FilterInfo<ShapeItem, "content">,
 * [FrameChanges.TypeEnum.Freeform]: FilterInfo<FrameItem, "title">
 * }} Filters
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

/** @type {import("@mirohq/miro-api/dist/highlevel/Item").WidgetItem[]}*/
let activeBoard

/**
 * 
 * @param {Board} board 
 * @returns 
 */
export async function getUnmodifiedItems(board) {
    const newBoard = await unwrapGenerator(board.getAllItems())

    /** @type {import("@mirohq/miro-api/dist/highlevel/Item").WidgetItem[]} */
    const retainedItems = []
    for (const item of activeBoard) {
        if (boardContainsItem(newBoard, item)) retainedItems.push(item)
    }
    activeBoard = retainedItems

    return retainedItems
}

/**
 * 
 * @param {import("@mirohq/miro-api/dist/highlevel/Item").WidgetItem[]} board 
 * @param {import("@mirohq/miro-api/dist/highlevel/Item").WidgetItem} item 
 * @returns 
 */
function boardContainsItem(board, item) {
    for (const widgetitem of board) {
        if (objectDeepEquals(widgetitem, item)) return true
    }
    return false
}

export async function createImage(miroapi, boardId, url) {
    return getBoard(miroapi, boardId).then(board => board.createImageItem({ data: { url } })).catch(console.warn)
}

/**
 * @param {Board} board
 * @param {{size: number, content: string, position: PositionChange, parent: string}} param2 
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
 * @param {{string, bgColor: FrameStyle["fillColor"], geometry: GeometryNoRotation, position: PositionChange}} param1 
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
 * @param {MiroApi} miroapi 
 * @param {string} boardId 
 * @param {CardCreateRequest} data 
 * @returns {Promise<CardItem>}
 */
export async function createCard(miroapi, boardId, data) {
    return getBoard(miroapi, boardId).then(board => board.createCardItem(data)).catch(console.warn)
}

/**
 * 
 * @param {Board} board
 * @param {{content: string, position: PositionChange}} param1 
 * @returns {Promise<StickyNoteItem>}
 */
export async function createStickyNote(board, { content, position }) {
    return board.createStickyNoteItem({
        data: { content },
        position
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
 * @param {Board} board 
 * @param {T} widgetType 
 * @returns {Promise<(Filters[T])[]>}
 */
export async function filterItems(board, widgetType) {
    return (await unwrapGenerator(board.getAllItems())).filter(({ type }) => type === widgetType)
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
    return (await filterItems(board, type)).find(card => strLike(searchKey, card.data[textLocation]))
}

/**
 * 
 * @param {keyof Filters} type 
 */
function findText(type) {
    switch (type) {
        case FrameChanges.TypeEnum.Freeform:
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
async function unwrapGenerator(generator) {
    const ls = []
    for await (const val of generator) {
        ls.push(val)
    }

    return ls
}

function objectDeepEquals(obj1, obj2) {
    const result = firstObjEqualsSecond(obj1, obj2) && firstObjEqualsSecond(obj2, obj1)
    console.log(`${obj1} = ${obj2}: ${result}`)
    return result
}

/**
 * 
 * @param {Record<string, unknown>} obj1 
 * @param {Record<string, unknown>} obj2 
 */
function firstObjEqualsSecond(obj1, obj2) {
    for (const key of Object.keys(obj1)) {
        const value = obj1[key]
        const valuetype = typeof value
        if (valuetype === "function") continue
        if (valuetype === "object") if (!firstObjEqualsSecond(value, obj2[key])) return false
        if (value !== obj2[key]) return false
    }

    return true
}