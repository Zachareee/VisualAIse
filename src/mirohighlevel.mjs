import { createCard, findCardOnBoard } from "./miroutils.mjs";

const HSPACE = 20, VSPACE = 50

export async function addCard(miroapi, boardId, options) {
    const { title, owner } = options

    const { position: { x, y } } = await findCardOnBoard(miroapi, boardId, owner)
    const data = {
        data: {
            title
        }
    }
    createCard(miroapi, boardId, data)
}
export async function removeCard(miroapi, boardId, owner, options) { }
export async function moveCard(miroapi, boardId, cardTitle, newowner) { }
export async function renameCard(miroapi, boardId, cardTitle, newTitle) { }