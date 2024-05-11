export async function getBoards(miroapi) {
    return unwrapGenerator(miroapi.getAllBoards())
}

export function getBoard(miroapi, boardId) {
    return miroapi.getBoard(boardId)
}

export async function getItems(miroapi, boardId) {
    return unwrapGenerator(await getBoard(miroapi, boardId).then(res => res.getAllItems())).catch(console.warn)
}

export function createCard(miroapi, boardId, data) {
    getBoard(miroapi, boardId).then(board => board.createCardItem(data)).catch(console.warn)
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

export function findCardOnBoard(miroapi, boardId, searchKey) {
    return getBoard(miroapi, boardId).then(board => findCard(board, searchKey))
}

async function findCard(board, searchKey) {
    return (await filterCards(board)).find(({ data: { title } }) => new RegExp(`.*${searchKey}.*`, "i").test(title))
}

async function filterCards(board) {
    return (await unwrapGenerator(await board.getAllItems())).filter(({ type }) => type === "card")
}

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
