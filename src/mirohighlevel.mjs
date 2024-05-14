import { createCard, filterCards, findCardOnBoard, getBoard } from "./miroutils.mjs";

const HSPACE = 20, VSPACE = 50

export async function addCard(miroapi, boardId, { title, owner }) {
    const { position: { x, y } } = await findCardOnBoard(miroapi, boardId, owner)
    const data = {
        data: {
            title
        },
        position: {
            x: x + HSPACE,
            y: y + VSPACE
        }
    }
    createCard(miroapi, boardId, data)
}
export async function removeCard(miroapi, boardId, owner, options) { }
export async function moveCard(miroapi, boardId, cardTitle, newowner) { }
export async function renameCard(miroapi, boardId, cardTitle, newTitle) { }

export async function getCategories(miroapi, boardId) {
    const categories = {}
    await getBoard(miroapi, boardId)
        .then(board => filterCards(board))
        .then(cards => cards.forEach(card => {
            if (categories[card.position.x]) categories[card.position.x] = [card]
            else categories[card.position.x].push(card)
        }))
        .then(() => Object.entries(categories).forEach(
            ([, arr]) => arr.sort((a, b) => a.position.y - b.position.y)
        ))

    return categories
}