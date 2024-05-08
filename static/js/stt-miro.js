const title = document.getElementById("title")
const thumbnail = document.getElementById("thumbnail")

const params = new URLSearchParams(window.location.search)

fetch(`/board?board=${params.get("board")}`).then(res => res.json()).then(data => {
    title.innerHTML = data.name
    thumbnail.src = data.picture.imageURL
}).catch(console.error)