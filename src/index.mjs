import express from "express"
import { Miro } from "@mirohq/miro-api"
import cookieParser from "cookie-parser"
import { resolve } from "path"
import { renderFile } from "ejs"

// custom utils
import Storage from "./store.mjs"
import {
    getBoards, getBoard, boardIsNull
} from "./miroutils.mjs"
import { chat } from "./aiutils.mjs"
import Pipes from "./pipes/Pipes.mjs"
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
    /** @type {{ cookies: { session: string }, query: any }} */
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
    /** @type {any} */
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
    /** @type {{ cookies: { session: string }, query: any }} */
    const { cookies: { session }, query: { board } } = req
    if (boardIsNull(board, res)) return

    return res.send(await getBoard(miro.as(session), board))
})

app.get("/stt", async (req, res) => {
    return res.sendFile(getStaticFile("stt.html"))
})

app.post("/chat", async (req, res) => {
    /** @type {{ cookies: { session: string }, body: { content: string }, query: any }} */
    const { cookies: { session: user }, body: { content }, query: { board } } = req
    if (boardIsNull(board, res)) return

    log("Message received:", content)
    await getBoard(miro.as(user), board).then(async board =>
        chat(board, user, content)
    )
    return res.send("ok")
})

app.post("/chats", async (req, res) => {
    /** @type {{ cookies: { session: string }, body: Record<string, string>[], query: any }} */
    const { cookies: { session }, body: content, query: { board } } = req
    if (boardIsNull(board, res)) return
    log("Convo is", content)

    /**
     * @type {Pipes[]}
     */
    const pipes = []
    getBoard(miro.as(session), board).then(async board => {
        for (const text of content) {
            const arr = Object.entries(text)[0]
            pipes.push(...await chat(board, arr[0], arr[1]))
        }
        res.send((await Promise.all(pipes.map(e => e.finish()))).filter(value => value))
        console.log("End conversation")
    })

})

app.listen(PORT, () => {
    console.log("Listening on port", PORT)
})