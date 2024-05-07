import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import "dotenv/config"

export default class Storage {
    constructor() {
        this.db = new LowSync(new JSONFileSync(process.env.TOKEN_STORE || "tokendb.json"), {})
        this.db.read()
    }

    async get(userId) {
        this.db.read()
        console.log(db.data)
        return this.db.data[userId]
    }

    async set(userId, state) {
        this.db.update((data) => {
            data[userId] = state
        })
    }
}