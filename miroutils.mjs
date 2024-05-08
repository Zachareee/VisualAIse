export async function getBoards(miroapi) {
    return unwrapGenerator(miroapi.getAllBoards())
}

export async function getBoard(miroapi, boardId) {
    return miroapi.getBoard(boardId)
}

async function unwrapGenerator(generator) {
    const ls = []
    for await (const val of generator) {
        ls.push(val)
    }

    return ls
}