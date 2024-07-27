import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";

export default class Storage {
    constructor() {
        this.db = new LowSync(
            /** @type {JSONFileSync<any>} */ (new JSONFileSync(process.env.TOKEN_STORE || "tokendb.json")), {}
        )
        this.db.read()
    }

    /**
     * 
     * @param {string} userId 
     */
    get(userId) {
        this.db.read()
        return this.db.data?.[userId]
    }

    /**
     * 
     * @param {string} userId 
     * @param {import("@mirohq/miro-api/dist/storage").State | undefined} state 
     */
    async set(userId, state) {
        this.db.update(data => {
            data[userId] = state
        })
    }
}