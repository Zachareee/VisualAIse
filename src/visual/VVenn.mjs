import { Board } from "@mirohq/miro-api";
import Pipes from "../pipes/Pipes.mjs";
import {
    createCircle, createText, randomPlaceInCircle
} from "../miroutils.mjs";
import { circlePosition, CIRCLERADIUS } from "./Positions.mjs";

class VVenn extends Pipes {
    /**
     * 
     * @param {Board} board 
     * @param {string} user 
     * @param {string} content 
     */
    async start(board, user, content) {
        const position = randomPlaceInCircle(circlePosition, CIRCLERADIUS)
        await createCircle(board, { size: CIRCLERADIUS, position: circlePosition })
        await createText(board, { content: `${user}: ${content}`, position })
        return this
    }
}

export default new VVenn
