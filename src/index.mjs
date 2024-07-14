import express from "express"
import { Miro } from "@mirohq/miro-api"
import cookieParser from "cookie-parser"
import { resolve } from "path"
import { renderFile } from "ejs"

// custom utils
import Storage from "./store.mjs"
import {
    getBoards, getBoard, createCard,
    deleteCard, updateCard, boardIsNull,
    unwrapGenerator
} from "./miroutils.mjs"
import { sortCards } from "./mirohighlevel.mjs"
import { chat, decide } from "./aiutils.mjs"
// import MiroBrowser from "./puppet.mjs"
// import { findClusters } from "./clustering.mjs"
import Pipes from "./utils/Pipes.mjs"
import VList from "./visual/VList.mjs"
import VCalendar from "./visual/VCalendar.mjs"
import log from "./Logger.mjs"

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
// after "/ss" which shouldn't need user creds
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

    return res.json(await unwrapGenerator((await getBoard(miro.as(session), board)).getAllItems()))
})

app.get("/stt", async (req, res) => {
    return res.sendFile(getStaticFile("stt.html"))
})

app.post("/chat", async (req, res) => {
    const { cookies: { session }, body: { content }, query: { board } } = req
    if (boardIsNull(board, res)) return

    log("Message received:", content)
    getBoard(miro.as(session), board).then(async board =>
        (await chat(board, content)).finish()
    )
    return res.send("ok")
})

app.post("/chats", async (req, res) => {
    const { cookies: { session }, body: content, query: { board } } = req
    if (boardIsNull(board, res)) return
    log("Convo is", content)

    /**
     * @type {Pipes[]}
     */
    const pipes = []
    getBoard(miro.as(session), board).then(async board => {
        for (const text of content)
            pipes.push(...await chat(board, text))
        res.send((await Promise.all(pipes.map(e => e.finish()))).filter(value => value))
        console.log("End conversation")
    })

})

app.post("/list", async (req, res) => {
    const { query: { board }, body, cookies: { session } } = req

    VList.prepareList(await getBoard(miro.as(session), board), body.content, 1)
    res.send("ok")
})

app.post("/calendar", async (req, res) => {
    const { query: { board }, body, cookies: { session } } = req

    VCalendar.prepareCalendar(await getBoard(miro.as(session), board), body)
    res.send("ok")
})

app.post("/decide", async (req, res) => {
    const { query: { board }, body, cookies: { session } } = req
    if (boardIsNull(board, res)) return

    res.send("ok")
    const miroapi = miro.as(session)
    const sortedCards = await sortCards(miroapi, board)
    body.forEach(obj => decide(miroapi, board, obj, sortedCards))
})

app.listen(PORT, () => {
    console.log("Listening on port", PORT)
})