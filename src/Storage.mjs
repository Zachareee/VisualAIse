import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";

const db = new LowSync(
            /** @type {JSONFileSync<any>} */(new JSONFileSync(process.env.TOKEN_STORE || "tokendb.json")), {}
)
db.read()

export default class Storage {
    /**
     * 
     * @param {string} userId 
     */
    static get(userId) {
        db.read()
        return db.data?.[userId]
    }

    /**
     * 
     * @param {string} userId 
     * @param {import("@mirohq/miro-api/dist/storage").State | undefined} state 
     */
    static async set(userId, state) {
        db.update(data => {
            data[userId] = state
        })
    }

    static getAllUsers() {
        db.read()
        return Object.keys(db.data)
    }
}