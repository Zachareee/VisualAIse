import { Board, MiroApi } from "@mirohq/miro-api";
import { generateImage } from "./aiutils.mjs";
// import { defaultRadius } from "./clustering.mjs";
import { createBox, createCard, createFrame, createImage, filterItems, GONES, getBoard, strLike, updateCard } from "./miroutils.mjs";

const VSPACE = 60 + 20, HSPACE = 320 + 20

export async function addCard(miroapi, boardId, { title, owner }, sortedCards) {
    const { position: { x, y } } = await randomPosition(owner, miroapi, boardId, "card") //getLastCard(sortedCards, owner)
    const data = {
        data: {
            title
        },
        position: {
            x,
            y
        }
    }
    createCard(miroapi, boardId, data)
    // sortedCards[x].push(data)
    // const offset = "50%"
    // generateImage(title).then(url => createImage(miroapi, boardId, url).then(async image => image.connectTo({ id: (await ).id, position: { x: offset, y: offset } })))
}

/**
 * 
 * @param {string} owner 
 * @param {MiroApi} miroapi 
 * @param {string} boardId 
 * @param {keyof import("./miroutils.mjs").Filters} type 
 * @returns 
 */
async function randomPosition(owner, miroapi, boardId, type) {
    const item = await GONES(owner, miroapi, boardId, type)
    console.log(item)
    const { position: { x, y } } = item
    const angle = Math.floor(Math.random() * 360)
    const radius = defaultRadius - 50 // make sure the card is nearer than the max radius
    return { position: { x: x + radius * Math.sin(angle), y: y + radius * Math.cos(angle) } }
}

export async function removeCard(miroapi, boardId, owner, options) { }

export async function moveCard(miroapi, boardId, { title, owner: newowner }, sortedCards) {
    const { position: { x, y } } = getLastCard(sortedCards, newowner)
    const data = {
        data: {
            title
        },
        position: {
            x: x,
            y: y + VSPACE
        }
    }
    updateCard(miroapi, boardId, title, data)
    sortedCards[x].push(data)
    // need to add chaining functionality
}

export async function renameCard(miroapi, boardId, { title, newTitle }, sortedCards) {
    updateCard(miroapi, boardId, title, { ...findCardOnBoard(miroapi, boardId, title), data: { title: newTitle } })
    // need to add chaining
}

export function getCategoryNames(sortedCards) {
    return Object.entries(sortedCards).map(([, arr]) => stripTag(arr[0].data.title))
}

export function stripTag(str) {
    return str.replaceAll(/<[^>]*>/g, "")
}

export async function sortCards(miroapi, boardId) {
    const columns = {}
    await getBoard(miroapi, boardId)
        .then(board => filterItems(board, "card"))
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
    const arr = Object.entries(sortedCards).find(([key, value]) => strLike(owner, value[0].data.title))?.[1]
    const card = arr ? arr[arr.length - 1] : { position: { x: 0, y: 0 } }
    return card
}