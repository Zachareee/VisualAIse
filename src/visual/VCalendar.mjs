import _ from "lodash"
import { Board, FrameItem, ShapeItem } from "@mirohq/miro-api"
import { createBox, createFrame, createStickyNote, createTag, createText, filterItems, findItem, updateFrameGeo } from "../miroutils.mjs"
import { BOXSIZE, calendarPosition, coordinateCalculator, stickySizeReduction, textHeight } from "./Positions.mjs"
import log from "../Logger.mjs"
import { date as originalDate } from "../pipes/Calendar.mjs"
import { PositionChange } from "@mirohq/miro-api/dist/api.js"

const CalendarFrameName = "Calendar"

class VCalendar {
    /**
     * 
     * @param {Board} board 
     * @param {string} user
     * @param {Record<string, string[]>} array 
     */
    async prepareCalendar(board, user, array) {
        const calendarframe = (await findItem(board, CalendarFrameName, "frame")) || (await createCalendar(board))

        let items = await getUnmodifiedItemsFromFrame(calendarframe)
        for (const [date, topic] of Object.entries(array)) {
            log("The current date is", date)

            await extendFrame(calendarframe, items.map(convertShapeToDate), Number(date)).then(
                day => fillBoxes(board, calendarframe, items, date, day)
            ).then(
                arr => items = arr.sort((item1, item2) => convertShapeToDate(item1) - convertShapeToDate(item2))
            ).then(
                arr => addDate(board, calendarframe, user, {
                    topic,
                    position: arr.find(item => item.data?.content === `${date}`)?.position
                })
            )
        }
        return calendarframe
    }
}

/**
 * 
 * @param {ShapeItem} shape 
 * @returns 
 */
const convertShapeToDate = shape => Number(shape.data?.content)

/**
 * @typedef {[number | undefined, number | undefined]} Range
 */

/**
 * 
 * @param {number[]} items 
 * @returns {Range}
 */
function getDateRange(items) {
    const arr = items.sort((a, b) => a - b)
    return [_.first(arr), _.last(arr)]
}

/**
 * 
 * @param {Board} board 
 * @param {FrameItem} parent 
 * @param {string} title
 * @param {{ topic: string[], position?: PositionChange}} param2 
 * @returns 
 */
async function addDate(board, parent, title, { topic, position }) {
    return createTag(board, { title }).then(
        ({ id }) => createStickyNote(board, {
            parent,
            content: topic.join(', '),
            position: position ?? calculatePosition(0, 0),
            size: BOXSIZE - stickySizeReduction
        }).then(note => note.attachTag(id))
    )
}

/**
 * 
 * @param {number} date 
 * @param {number} startDay 
 * @returns 
 */
const rowFormula = (date, startDay) => Math.floor((date + startDay - 1) / 7)

/**
 * 
 * @param {Board} board 
 * @param {FrameItem} parent 
 * @param {ShapeItem[]} items 
 * @param {string} date
 * @param {number} startDay
 */
async function fillBoxes(board, parent, items, date, startDay) {
    const dates = items.map(convertShapeToDate)
    /**
     * @type {Promise<ShapeItem>[]}
     */
    const arr = [createDateBox(board, parent, Number(date), startDay, getDateRange(dates))]
    if (items.length == 0)
        return Promise.all(arr);

    const newDates = [...dates, Number(date)]
    const datesRange = getDateRange(newDates)
    newDates.reduce((accum, current) => {
        for (let i = accum + 1; i < current; i++) {
            arr.push(createDateBox(board, parent, i, startDay, datesRange))
        }
        return current
    })

    return [...items, ...await Promise.all(arr)]
}

/**
 * 
 * @param {Board} board 
 * @param {FrameItem} parent 
 * @param {number} date 
 * @param {number} startDay 
 * @param {Range} datesRange 
 */
async function createDateBox(board, parent, date, startDay, datesRange) {
    const num = date + startDay - 1
    const x = num % 7

    const row = rowFormula(date, startDay)
    const y = rowNumber(row, startDay, datesRange)
    return createBox(board, {
        size: BOXSIZE,
        content: `${date}`,
        position: calculatePosition(x, y),
        parent
    })
}

/**
 * 
 * @param {number} row 
 * @param {number} startDay 
 * @param {Range} datesRange 
 */
function rowNumber(row, startDay, datesRange) {
    const min = rowFormula(datesRange[0] ?? 31, startDay)  // set to some row number which cannot exist
    if (row < min) return 0
    return row - min
}

/**
 * 
 * @param {FrameItem} frame 
 * @param {number[]} items 
 * @param {number} newDate
 */
async function extendFrame(frame, items, newDate) {
    const date = new Date(originalDate)
    date.setDate(1)
    const day = date.getDay()

    if (items.includes(newDate)) return day

    const row = rowFormula(newDate, day)
    const rows = items.map(num => rowFormula(num, day))

    if (rows.includes(row)) return day

    rows.sort((a, b) => a - b)

    const first = rows[0], last = rows[rows.length - 1]
    await increaseFrameHeight(frame, (row < first ? first - row : row - last) || 0)
    if (row < first) await downShiftAll(frame, first - row)
    return day
}

/**
 * 
 * @param {FrameItem} frame 
 * @param {number} times
 */
async function downShiftAll(frame, times) {
    return Promise.all(
        /** @type {["sticky_note", "shape"]} */
        (["sticky_note", "shape"]).map(
            filterKey => filterItems(frame, filterKey).then(
                arr => Promise.all(arr.map(
                    item => item.update({
                        position: {
                            y: (item.position?.y ?? 0) + BOXSIZE * times
                        }
                    })
                ))
            )
        )
    )
}

/**
 * @param {FrameItem} frame 
 * @param {number} numRows 
 */
async function increaseFrameHeight(frame, numRows) {
    const height = (frame.geometry?.height ?? 0) + numRows * BOXSIZE
    return updateFrameGeo(frame, { height })
}

/**
 * 
 * @param {FrameItem} frame 
 * @returns 
 */
async function getUnmodifiedItemsFromFrame(frame) {
    return (await filterItems(frame, "shape")).filter(boxCentered)
}

/**
 * 
 * @param {ShapeItem} box 
 */
function boxCentered(box) {
    return (box.position?.x ?? 0) % BOXSIZE === BOXSIZE / 2 &&
        ((box.position?.y ?? textHeight) - textHeight) % BOXSIZE === BOXSIZE / 2
}

/**
 * @param {Board} board
 */
async function createCalendar(board) {
    // calendar
    const frame = await createFrame(board, {
        title: CalendarFrameName,
        bgColor: "#ffcee0",
        position: calendarPosition,
        geometry: { height: BOXSIZE + textHeight, width: 7 * BOXSIZE }
    });

    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        .forEach((content, idx) => createText(board, {
            content,
            parent: frame,
            geometry: {
                width: BOXSIZE
            },
            position: {
                x: (idx + 0.5) * BOXSIZE,
                y: textHeight * 0.5
            }
        }))

    return frame
}

const calculatePosition = coordinateCalculator({height: BOXSIZE, width: BOXSIZE, yOffset: textHeight})

// /**
//  * 
//  * @param {number} y 
//  * @param {number} x 
//  */
// function calculatePosition(x, y) {
//     return { x: BOXSIZE * (x + 0.5), y: textHeight + BOXSIZE * (y + 0.5) }
// }

export default new VCalendar()