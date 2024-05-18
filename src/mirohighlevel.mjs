import { createCard, filterCards, findCardOnBoard, getBoard, strLike, updateCard } from "./miroutils.mjs";

const VSPACE = 60 + 20, HSPACE = 320 + 20

export function addCard(miroapi, boardId, { title, owner }, sortedCards) {
    const { position: { x, y } = {} } = getLastCard(sortedCards, owner)
    const data = {
        data: {
            title
        },
        position: {
            x: x ?? 0,
            y: (y ?? 0) + VSPACE
        }
    }
    createCard(miroapi, boardId, data)
    sortedCards[x].push(data)
}

export async function removeCard(miroapi, boardId, owner, options) { }

export async function moveCard(miroapi, boardId, { title, owner: newowner }, sortedCards) {
    const { position: { x, y } = {} } = getLastCard(sortedCards, newowner)
    const data = {
        data: {
            title
        },
        position: {
            x: x ?? 0,
            y: (y ?? 0) + VSPACE
        }
    }
    updateCard(miroapi, boardId, title, data)
    sortedCards[x].push(data)
    // need to add chaining functionality
}

export async function renameCard(miroapi, boardId, { title, newTitle }, sortedCards) {
    updateCard(miroapi, boardId, title, {...findCardOnBoard(miroapi, boardId, title), data: {title: newTitle}})
    // need to add chaining
}

export function getCategoryNames(sortedCards) {
    return Object.entries(sortedCards).map(([, arr]) => arr[0].data.title)
}

export async function sortCards(miroapi, boardId) {
    const columns = {}
    await getBoard(miroapi, boardId)
        .then(board => filterCards(board))
        .then(cards => cards.forEach(card => {
            if (!columns[card.position.x]) columns[card.position.x] = [card]
            else columns[card.position.x].push(card)
        }))
        .then(() => Object.entries(columns).forEach(
            ([, arr]) => arr.sort((a, b) => a.position.y - b.position.y)
        ))

    return columns
}

function getLastCard(sortedCards, owner) {
    const arr = Object.entries(sortedCards).find(([key, value]) => strLike(owner, value[0].data.title))[1]
    const card = arr ? arr[arr.length - 1] : {}
    return card
}