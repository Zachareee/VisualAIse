import express from "express"
import "dotenv/config"
import { Miro } from "@mirohq/miro-api"
import Storage from "./store.mjs"
import cookieParser from "cookie-parser"

// Variables
const PORT = process.env.port || 3000

const miro = new Miro({ storage: new Storage() })
const app = express()

app.use(cookieParser())

// Route declarations
app.get("/", async (req, res) => {
    const { session } = req.cookies
    const { user } = req.query

    if (!(session || user))
        return res.status(401).send("Missing user param")

    if (!await miro.isAuthorized(session))
        return res.redirect(miro.getAuthUrl(user))

    return res.send(`Welcome, ${session}!\n Your auth_token is ${await miro.getAccessToken(session)}`)
})

app.get("/auth", async (req, res) => {
    const { state: user } = req.query
    miro.handleAuthorizationCodeRequest(user, req)
    res.cookie("session", user)

    return res.redirect("/")
})

app.listen(PORT, () => {
    console.log("Listening on port", PORT)
})