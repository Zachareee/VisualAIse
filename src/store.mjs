import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";

export default class Storage {
    constructor() {
        this.db = new LowSync(new JSONFileSync(process.env.TOKEN_STORE || "tokendb.json"), {})
        this.db.read()
    }

    get(userId) {
        this.db.read()
        return this.db.data[userId]
    }

    async set(userId, state) {
        this.db.update((data) => {
            data[userId] = state
        })
    }
}