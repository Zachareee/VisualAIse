import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";

export default class Storage {
    private db: LowSync<Data>

    constructor() {
        this.db = new LowSync(new JSONFileSync(process.env.TOKEN_STORE || "tokendb.json"), <Data>{})
        this.db.read()
    }

    get(userId: string) {
        this.db.read()
        return this.db.data[userId]
    }

    async set(userId: string, state: Auth) {
        this.db.update((data) => {
            data[userId] = state
        })
    }
}

type Auth = { accessToken: string, userId: string }
type Data = { [id: string]: Auth }