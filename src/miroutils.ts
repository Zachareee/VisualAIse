import { Board, CardItem, MiroApi } from "@mirohq/miro-api"
import { CardCreateRequest, CardUpdateRequest } from "@mirohq/miro-api/dist/api"
import { WidgetItem } from "@mirohq/miro-api/dist/highlevel/Item"

// export async function getBoards(miroapi: MiroApi) {
//     return unwrapGenerator(miroapi.getAllBoards())
// }

export function getBoard(miroapi: MiroApi, boardId: string) {
    return miroapi.getBoard(boardId)
}

export async function getItems(miroapi: MiroApi, boardId: string) {
    return unwrapGenerator(await getBoard(miroapi, boardId).then(res => res.getAllItems())).catch(console.warn)
}

export async function createImage(miroapi: MiroApi, boardId: string, url: string) {
    return getBoard(miroapi, boardId).then(board => board.createImageItem({ data: { url } })).catch(console.warn)
}

export async function createCard(miroapi: MiroApi, boardId: string, data: CardCreateRequest) {
    return getBoard(miroapi, boardId).then(board => board.createCardItem(data)).catch(console.warn)
}

export function deleteCard(miroapi: MiroApi, boardId: string, searchKey: string) {
    findCardOnBoard(miroapi, boardId, searchKey).then(card => card?.delete()).catch(console.warn)
}

export function updateCard(miroapi: MiroApi, boardId: string, searchKey: string, data: CardUpdateRequest) {
    findCardOnBoard(miroapi, boardId, searchKey).then(card => card?.update(data)).catch(console.warn)
}

export function boardIsNull(board: string, res: any) {
    if (!board) res.status(401).send("Query parameter \"board\" is missing")
    return !board
}

export async function findCardOnBoard(miroapi: MiroApi, boardId: string, searchKey: string) {
    return getBoard(miroapi, boardId).then(board => findCard(board, searchKey))
}

export async function filterCards(board: Board) {
    return <NonNullable<CardItem>[]>(await unwrapGenerator(board.getAllItems())).filter(({ type }) => type === "card")
}

export function strLike(regex: string, test: string | undefined): boolean {
    return test ? new RegExp(`.*${regex}.*`, "i").test(test) : false
}

async function findCard(board: Board, searchKey: string) {
    return (await filterCards(board)).find(card => strLike(searchKey, card.data?.title))
}

async function unwrapGenerator(generator: AsyncGenerator<WidgetItem, void, unknown>) {
    const ls = <WidgetItem[]>[]
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
