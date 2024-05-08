const list = document.getElementById("boardslist")

fetch("/boards").then(res => res.json()).then(addToDiv).catch(console.error)

function addToDiv(res) {
    for (obj of res) {
        const { name, picture: { imageURL }, id } = obj
        const div = document.createElement("div")
        const link = createLink(`/stt?board=${id}`)

        link.appendChild(createBoardTitle(name))
        link.appendChild(createImage(imageURL))
        div.appendChild(link)
        list.appendChild(div)
    }
}

function createBoardTitle(title) {
    const elem = document.createElement("h3")
    elem.innerHTML = title
    return elem
}

function createImage(src) {
    const img = new Image(100, 100)
    img.src = src
    return img
}

function createLink(url) {
    const link = document.createElement("a")
    link.href = url
    return link
}