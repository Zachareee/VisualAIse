import express from "express"
import { Miro } from "@mirohq/miro-api"
import cookieParser from "cookie-parser"
import { resolve } from "path"
import { renderFile } from "ejs"

// custom utils
import Storage from "./store.mjs"
import {
    getBoards, getBoard, getItems, createCard,
    deleteCard, updateCard, boardIsNull
} from "./miroutils.mjs"
import { chat } from "./aiutils.mjs"

// Variables
const PORT = process.env.port || 3000

const miro = new Miro({ storage: new Storage() })
const app = express()

app.use(cookieParser())
app.use(express.json())
app.engine("html", renderFile)

const STATIC = `${resolve()}/static`
const getStaticFile = file => `${STATIC}/${file}`
app.use(express.static(STATIC))

// Route declarations
app.get("/", async (req, res) => {
    const { cookies: { session }, query: { user } } = req

    // make sure user is authed or trying to auth
    if (!(session || user))
        return res.status(401).send("Missing user param")

    // retrieve token and store with provided user name
    if (!await miro.isAuthorized(session))
        return res.render(getStaticFile("unauth.html"), { link: miro.getAuthUrl(user) })

    return res.sendFile(getStaticFile("boards.html"))
})

app.get("/auth", async (req, res) => {
    const { state: user } = req.query
    miro.handleAuthorizationCodeRequest(user, req)
    res.cookie("session", user)

    return res.redirect("/")
})

// mounted after "/" to avoid infinite redirects
// after "/auth" to avoid intercepting auth code
app.use(async (req, res, next) => {
    const { session } = req.cookies

    if (await miro.isAuthorized(session)) return next()
    return res.redirect("/")
})

app.get("/boards", async (req, res) => {
    const { session } = req.cookies
    return res.json(await getBoards(miro.as(session)))
})

app.get("/board", async (req, res) => {
    const { cookies: { session }, query: { board } } = req
    if (boardIsNull(board, res)) return

    return res.json(await getBoard(miro.as(session), board))
})

app.get("/stt", async (req, res) => {
    return res.sendFile(getStaticFile("stt.html"))
})

app.get("/allItems", async (req, res) => {
    const { cookies: { session }, query: { board } } = req
    if (boardIsNull(board, res)) return

    return res.json(await getItems(miro.as(session), board))
})

app.post("/card", async (req, res) => {
    const { cookies: { session }, query: { board }, body } = req
    if (boardIsNull(board, res)) return

    createCard(miro.as(session), board, body)
    return res.send("ok")
})

app.patch("/card", async (req, res) => {
    const { cookies: { session }, query: { board }, body } = req
    if (boardIsNull(board, res)) return

    updateCard(miro.as(session), board, body)
    return res.send("ok")
})

app.delete("/card", async (req, res) => {
    const { cookies: { session }, query: { board, cardTitle } } = req
    if (boardIsNull(board, res)) return

    deleteCard(miro.as(session), board, cardTitle)
    return res.send("ok")
})

app.post("/chat", async (req, res) => {
    const { cookies: { session }, body: { content }, query: { board } } = req
    if (boardIsNull(board, res)) return

    chat(miro.as(session), board, content)
    return res.send("ok")
})

app.listen(PORT, () => {
    console.log("Listening on port", PORT)
})