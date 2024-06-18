import { Board, CardItem, MiroApi, ShapeItem, StickyNoteItem } from "@mirohq/miro-api"
import { CardCreateRequest, FrameStyle, GeometryNoRotation, PositionChange, StickyNoteCreateRequest } from "@mirohq/miro-api/dist/api.js"

/**
 * @typedef {{card: CardItem, sticky_note: StickyNoteItem, shape: ShapeItem}} Filters
 */

/**
 * 
 * @typedef {{card: "title", sticky_note: "content", shape: "content"}} TextLocation
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
export function getBoard(miroapi, boardId) {
    return miroapi.getBoard(boardId)
}

export async function getItems(miroapi, boardId) {
    return unwrapGenerator(await getBoard(miroapi, boardId).then(res => res.getAllItems())).catch(console.warn)
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
export async function createStickyNote(board, {content, position}) {
    return board.createStickyNoteItem({
        data: {content},
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
export async function findItemOnBoard(board, searchKey, type) {
    return getBoard(miroapi, boardId).then(board => findItem(board, searchKey, type))
}

/**
 * @template {keyof Filters} T
 * @param {Board} board 
 * @param {T} widgetType 
 * @returns {Promise<Filters[T][]>}
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
 * @template {keyof TextLocation} T
 * @param {Board} board 
 * @param {string} searchKey 
 * @param {T} type
 * @param {TextLocation[T]} textLocation
 */
export async function findItem(board, searchKey, type, textLocation) {
    return (await filterItems(board, type)).find(card => strLike(searchKey, card.data[textLocation]))
}

/**
 * 
 * @template T
 * @param {AsyncGenerator<T, void, unknown>} generator 
 * @returns {T[]}
 */
async function unwrapGenerator(generator) {
    const ls = []
    for await (const val of generator) {
        ls.push(val)
    }

    return ls
}

// card structure
/*{
    "data": {
        "assigneeId": "string",
        "description": "string",
        "dueDate": "Date",
        "title": "string"
    },
    "geometry": {
        "height": "number",
        "width": "number",
        "rotation": "number"
    },
    "parent": {
        "id": "string"
    },
    "position": {
        "x": "number",
        "y": "number"
    },
    "style": {
        "cardTheme": "string" // hexcode eg #F02AD8
    }
}*/
