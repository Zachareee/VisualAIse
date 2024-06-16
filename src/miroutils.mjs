import { Board, CardItem, MiroApi, StickyNoteItem } from "@mirohq/miro-api"
import { CardCreateRequest, StickyNoteCreateRequest } from "@mirohq/miro-api/dist/api.js"

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
 * @param {MiroApi} miroapi 
 * @param {string} boardId 
 * @param {StickyNoteCreateRequest} data 
 * @returns {Promise<StickyNoteItem>}
 */
export async function createStickyNote(miroapi, boardId, data) {
    return getBoard(miroapi, boardId).then(board => board.createStickyNoteItem(data)).catch(console.warn)
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
 * @returns 
 */
export async function findCardOnBoard(miroapi, boardId, searchKey) {
    return getBoard(miroapi, boardId).then(board => findCard(board, searchKey))
}

/**
 *
 * @typedef {{card: CardItem, sticky_note: StickyNoteItem}} Filters
 * @typedef {keyof Filters} T
 * @param {Board} board 
 * @param {import("@mirohq/miro-api/dist/highlevel/Item").WidgetItem}
 * @param {T} widgetType 
 * @returns {(Promise<Filters[T][]>)}
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
    return test ? new RegExp(`.*${regex}.*`, "i").test(test) : false
}

/**
 * 
 * @param {Board} board 
 * @param {string} searchKey 
 * @returns 
 */
async function findCard(board, searchKey) {
    return (await filterItems(board, "card")).find(card => strLike(searchKey, card.data?.title))
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
