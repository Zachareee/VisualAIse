export async function getBoards(miroapi) {
    return await unwrapGenerator(miroapi.getAllBoards())
}

async function unwrapGenerator(generator) {
    const ls = []
    for await (const val of generator) {
        ls.push(val)
    }

    return ls
}