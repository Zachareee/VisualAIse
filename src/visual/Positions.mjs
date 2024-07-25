import { PositionChange } from "@mirohq/miro-api/dist/api.js";

export const BOXSIZE = 150
export const CARDWIDTH = 320, CARDHEIGHT = 60

/**
 * @type {PositionChange}
 */
export const calendarPosition = { x: 0, y: 0 }

/**
 * @type {PositionChange}
 */
export const listPosition = { x: 0, y: 1000 }

export const fontSize = Math.floor(BOXSIZE * 3 / 20)
export const textHeight = BOXSIZE / 2
export const stickySizeReduction = 50