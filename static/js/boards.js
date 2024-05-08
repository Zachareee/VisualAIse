const list = document.getElementById("boardslist")

fetch("/boards").then(res => res.json()).then(addToDiv)

function addToDiv(res) {
    console.log(res)
    for (obj of res) {
        const { name, picture: { imageURL } } = obj
        const div = document.createElement("div")

        div.appendChild(createBoardTitle(name))
        div.appendChild(createImage(imageURL))
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