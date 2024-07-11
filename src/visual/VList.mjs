import { Board } from "@mirohq/miro-api";
import { findItem } from "../miroutils.mjs";

const MatrixFrameName = "Matrix"

const matrix = (await findItem(board, MatrixFrameName, "frame"))
    || (await createMatrix(board))

/**
 * 
 * @param {Board} board 
 */
async function createMatrix(board) { }