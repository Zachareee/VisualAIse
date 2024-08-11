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

/** The miro application which we will run APIs from */
const miro = new Miro({ storage: Storage, redirectUrl: `http://localhost:${PORT}/auth` })
/** The Express app */
const app = express()

app.use(cookieParser())
app.use(express.json())
app.engine("html", renderFile)

/** The path which we will serve HTML files from */
const STATIC = `${resolve()}/static`

/**
 * 
 * @param {string} file 
 * @returns 
 */
const getStaticFile = file => `${STATIC}/${file}`
// Serve the HTML files
app.use(express.static(STATIC))

// Route declarations
app.get("/", async (_, res) => {
    return res.sendFile(getStaticFile("login.html"))
})

// Show the users which have signed in before
app.get("/users", async (_, res) => {
    const arr = Storage.getAllUsers()

    // Shows no users if there are no users found, otherwise creates HTML containing links to sign-in automatically
    return res.send(arr.length ? arr.map(user => `<a href="/home?user=${user}">${user}</a>`).join("\n") : "There are no users")
})

// Show the boards on the Miro team which the application is installed on
app.get("/home", async (req, res) => {
    /** @type {{ cookies: { session: string }, query: any }} */
    const { cookies: { session }, query: { user } } = req

    // If there is no session cookie, sets it
    if (!session) res.cookie('session', user)

    /** The username of the current user */
    const username = user || session

    // Shows the unauth webpage, allowing the user to return a token for authentication
    // retrieve token and store with provided user name
    if (!await isAuthorized(username))
        return res.render(getStaticFile("unauth.html"), { link: miro.getAuthUrl(username) })

    // Show the boards page
    return res.sendFile(getStaticFile("boards.html"))
})

// An endpoint to receive the authentication code from the unauth webpage mentioned in /home
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

// Retrieves all the boards on the Miro team
app.get("/boards", async (req, res) => {
    const { session } = req.cookies
    return res.json(await getBoards(miro.as(session)))
})

// Returns details about the specific board
app.get("/board", async (req, res) => {
    /** @type {{ cookies: { session: string }, query: any }} */
    const { cookies: { session }, query: { board } } = req
    if (boardIsNull(board, res)) return

    return res.send(await getBoard(miro.as(session), board))
})

// Serves the speech recognition interface
app.get("/stt", async (_, res) => {
    return res.sendFile(getStaticFile("stt.html"))
})

// The endpoint to receive text interpreted from the stt webpage
app.post("/chat", async (req, res) => {
    /** @type {{ cookies: { session: string }, body: { content: string }, query: any }} */
    const { cookies: { session: user }, body: { content }, query: { board } } = req
    if (boardIsNull(board, res)) return

    log("Message received:", content)

    // Wait for the chat function to complete before replying ok
    await getBoard(miro.as(user), board).then(async board =>
        chat(board, user, content)
    )
    return res.send("ok")
})

// Endpoint for automated tests i.e. simulates sending to /chat multiple times
app.post("/chats", async (req, res) => {
    /** @type {{ cookies: { session: string }, body: Record<string, string>[], query: any }} */
    const { cookies: { session }, body: content, query: { board } } = req
    if (boardIsNull(board, res)) return
    log("Convo is", content)

    /**
     * Collects all the pipelines created and returns the state of each pipe
     * @type {Pipes[]}
     */
    const pipes = []

    // using the board specified
    getBoard(miro.as(session), board).then(async board => {
        // loop through every message in the array
        for (const text of content) {
            /** Represents a user-message pairing */
            const arr = Object.entries(text)[0]
            pipes.push(...await chat(board, arr[0], arr[1]))
        }
        // sends the state back to the caller
        res.send((await Promise.all(pipes.map(e => e.finish()))).filter(value => value))
        console.log("End conversation")
    })
})

/**
 * Tests if the user has a valid authentication token in the storage
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