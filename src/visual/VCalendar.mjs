import _ from "lodash"
import { Board, FrameItem, ShapeItem } from "@mirohq/miro-api"
import { createBox, createFrame, createStickyNote, filterItems, findItem } from "../miroutils.mjs"
import { BOXSIZE, calendarPosition } from "./Positions.mjs"
import log from "../Logger.mjs"
import { date as originalDate } from "../pipes/Calendar.mjs"
import { PositionChange } from "@mirohq/miro-api/dist/api.js"

const CalendarFrameName = "Calendar"

class VCalendar {
    /**
     * 
     * @param {Board} board 
     * @param {Record<string, string[]>} array 
     */
    async prepareCalendar(board, array) {
        const calendarframe = (await findItem(board, CalendarFrameName, "frame")) || (await createCalendar(board))

        let items = await getUnmodifiedItemsFromFrame(calendarframe)
        for (const [date, topic] of Object.entries(array)) {
            log("The current date is", date)
            log("Current dates are", items.map(shape => shape.data?.content))
            // const idx = idxInSortedArray(items.map(item => Number(item.data?.content)), Number(date))
            await extendFrame(calendarframe, items.map(item => Number(item.data?.content)), Number(date)).then(
                // () => Promise.all([rightShiftItems(items, idx), rightShiftStickys(calendarframe, idx)])
                day => fillBoxes(board, calendarframe, items, date, day)
            ).then(
                arr => items = arr.sort((item1, item2) => Number(item1.data?.content) - Number(item2.data?.content))
            ).then(
                arr => addDate(board, calendarframe, {
                    topic,
                    position: arr.find(item => item.data?.content === `${date}`)?.position
                })
            )
        }
        return calendarframe
    }
}

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
 * @param {{ topic: string[], position?: PositionChange}} param2 
 * @returns 
 */
async function addDate(board, parent, { topic, position }) {
    return createStickyNote(board, {
        parent,
        content: topic.join('\n'),
        position: position ?? calculatePosition(0, 0)
    })
}

/**
 * 
 * @param {number} date 
 * @param {number} startDay 
 * @returns 
 */
function rowFormula(date, startDay) {
    return Math.floor((date - startDay + 1) / 7)
}

/**
 * 
 * @param {Board} board 
 * @param {FrameItem} parent 
 * @param {ShapeItem[]} items 
 * @param {string} date
 * @param {number} startDay
 */
async function fillBoxes(board, parent, items, date, startDay) {
    const dates = items.map(shape => Number(shape.data?.content))
    /**
     * @type {Promise<ShapeItem>[]}
     */
    const arr = [createDateBox(board, parent, Number(date), startDay, getDateRange(dates))]
    if (items.length == 0)
        return Promise.all(arr);

    const newDates = [...dates, Number(date)]
    const datesRange = getDateRange(newDates)
    newDates.sort((a, b) => a - b)
        .reduce((item1, item2) => {
            const accum = item1, current = item2
            for (let i = accum + 1; i < current; i++) {
                log("For loop run")
                arr.push(createDateBox(board, parent, i, startDay, datesRange))
            }
            return item2
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
    console.log('y is', y)
    const position = calculatePosition(x, y)
    return createBox(board, {
        size: BOXSIZE,
        content: `${date}`,
        position,
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
    const max = rowFormula(datesRange[1] ?? 31, startDay)  // set to some row number which cannot exist
    console.log("Min is", min)
    if (row < min) {
        log("Less than")
        return 0
    }
    if (row > max) {
        log("More than")
        return row - max
    }
    log("Within range")
    return row - min
}

/**
//  * 
//  * @param {Board} board 
//  * @param {FrameItem} parent 
//  * @param {{date: string, topic: string[], idx: number}} param2 
//  * @returns 
//  */
// async function addDate(board, parent, { date, topic, idx }) {
//     return Promise.all([
//         createBox(board, {
//             size: BOXSIZE,
//             content: date,
//             position: {
//                 x: BOXSIZE * (idx + 0.5),
//                 y: BOXSIZE / 2
//             },
//             parent
//         }),
//         createStickyNote(board, {
//             content: topic.join("\n"),
//             position: {
//                 x: BOXSIZE * (idx + 0.5),
//                 y: BOXSIZE / 2
//             },
//             parent
//         })
//     ])
// }

// /**
//  * 
//  * Compares the "compare" value against all numbers in the array
//  * @param {number[]} arr A sorted array
//  * @param {number} compare A value to compare against
//  * @returns {number} The index it would take as if it was part of the sorted array
//  */
// function idxInSortedArray(arr, compare) {
//     const idx = arr.findIndex(value => compare < value)
//     return idx === -1 ? arr.length : idx
// }

// /**
//  * 
//  * @param {ShapeItem[]} items Array of items
//  * @param {number} [startingFrom=0] The starting index to shift items
//  * @param {number} [times=1] How many times to shift
//  */
// function rightShiftItems(items, startingFrom = 0, times = 1) {
//     return items.filter((_, idx) => idx >= startingFrom).map(item =>
//         item.update({ position: { x: (item.position?.x ?? 0) + times * BOXSIZE } })
//     )
// }

// /**
//  * @param {FrameItem} frame 
//  * @param {number} [startingFrom=0] The starting index to shift items
//  * @param {number} [times=1] How many times to shift
//  */
// async function rightShiftStickys(frame, startingFrom = 0, times = 1) {
//     return Promise.all((await filterItems(frame, "sticky_note"))
//         .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0))
//         .filter((_, idx) => idx >= startingFrom)
//         .map(note => note.update({ position: { x: (note.position?.x ?? 0) + times * BOXSIZE } }))
//     )
// }

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
    await increaseFrameHeight(frame, row < first ? first - row : row - last)
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
    log(numRows)
    const height = (frame.geometry?.height ?? 0) + numRows * BOXSIZE
    frame.geometry = { ...frame.geometry, height }
    return frame.update({ geometry: { height } })
}

/**
 * 
 * @param {FrameItem} frame 
 * @returns 
 */
async function getUnmodifiedItemsFromFrame(frame) {
    const newBoard = await filterItems(frame, "shape")
    return newBoard.filter(item => (item.position?.x ?? 0) % BOXSIZE === BOXSIZE / 2 && (item.position?.y ?? 0) % BOXSIZE === BOXSIZE / 2)
}

/**
 * @param {Board} board
 * @param {number} [min=0]
 * @param {number} [max=0]
 */
async function createCalendar(board, min = 0, max = 0) {
    const count = max - min + 1
    const width = count * BOXSIZE, height = BOXSIZE

    // calendar
    const frame = await createFrame(board, {
        title: CalendarFrameName,
        bgColor: "#ffcee0",
        position: calendarPosition,
        geometry: { height, width: 7 * BOXSIZE }
    })

    log("items is empty, initialising calendar...")

    return frame
}

/**
 * 
 * @param {number} y 
 * @param {number} x 
 */
function calculatePosition(x, y) {
    return { x: BOXSIZE * (x + 0.5), y: BOXSIZE * (y + 0.5) }
}

export default new VCalendar()