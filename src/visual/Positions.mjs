import { PositionChange } from "@mirohq/miro-api/dist/api.js";

export const BOXSIZE = 300
export const CARDWIDTH = 320, CARDHEIGHT = 100

/**
 * @type {PositionChange}
 */
export const calendarPosition = { x: 0, y: 0 }

/**
 * @type {PositionChange}
 */
export const listPosition = { x: 0, y: BOXSIZE + CARDHEIGHT }