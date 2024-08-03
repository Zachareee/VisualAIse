import express from "express"
import { Miro } from "@mirohq/miro-api"
import cookieParser from "cookie-parser"
import { resolve } from "path"
import { renderFile } from "ejs"

// custom utils
import Storage from "./Storage.mjs"
import { getBoards, getBoard } from "./miroutils.mjs"
import { chat } from "./AIutils.mjs"
import Pipes from "./pipes/Pipes.mjs"
import log from "./Logger.mjs"

// Variables
const PORT = process.env.port || 3000

const miro = new Miro({ storage: Storage, redirectUrl: `http://localhost:${PORT}/auth` })
const app = express()

app.use(cookieParser())
app.use(express.json())
app.engine("html", renderFile)

const STATIC = `${resolve()}/static`

/**
 * 
 * @param {string} file 
 * @returns 
 */
const getStaticFile = file => `${STATIC}/${file}`
app.use(express.static(STATIC))

// Route declarations
app.get("/", async (_, res) => {
    return res.sendFile(getStaticFile("login.html"))
})

app.get("/users", async (_, res) => {
    const arr = Storage.getAllUsers()
    return res.send(arr.length ? arr.map(user => `<a href="/home?user=${user}">${user}</a>`).join("\n") : "There are no users")
})

app.get("/home", async (req, res) => {
    /** @type {{ cookies: { session: string }, query: any }} */
    const { cookies: { session }, query: { user } } = req

    if (!session)
        res.cookie('session', user)

    const username = user || session

    // retrieve token and store with provided user name
    if (!await isAuthorized(username))
        return res.render(getStaticFile("unauth.html"), { link: miro.getAuthUrl(username) })

    return res.sendFile(getStaticFile("boards.html"))
})

app.get("/auth", async (req, res) => {
    /** @type {any} */
    const { state: user } = req.query
    miro.handleAuthorizationCodeRequest(user, req)
    res.cookie("session", user)

    return res.redirect("/home")
})

// authorises all requests
// mounted after "/" to avoid infinite redirects
// after "/auth" to avoid intercepting auth code
app.use(async (req, res, next) => {
    const { session } = req.cookies

    if (await isAuthorized(session)) return next()
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

app.get("/stt", async (_, res) => {
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

/**
 * 
 * @param {string} session 
 * @returns 
 */
async function isAuthorized(session) {
    return await miro.isAuthorized(session) && miro.as(session).tokenInfo().catch(() => false)
}

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`)
})

function boardIsNull(board, res) {
    if (!board) res.status(401).send("Query parameter \"board\" is missing")
    return !board
}