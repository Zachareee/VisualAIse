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
 * @param {Board} board 
 * @param {FrameItem} parent 
 * @param {ShapeItem[]} items 
 * @param {string} date
 * @param {number} startDay
 */
async function fillBoxes(board, parent, items, date, startDay) {
    /**
     * @type {Promise<ShapeItem>[]}
     */
    const arr = [createDateBox(board, parent, Number(date), startDay)]
    if (items.length <= 1)
        return Promise.all(arr);

    [...items.map(shape => Number(shape.data?.content)), Number(date)].reduce((item1, item2) => {
        const accum = item1, current = item2
        for (let i = accum + 1; i < current; i++) {
            log("For loop run")
            arr.push(createDateBox(board, parent, i, startDay))
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
 */
async function createDateBox(board, parent, date, startDay) {
    const num = date + startDay - 1
    const x = num % 7
    const y = Math.floor(num / 7)
    const position = calculatePosition(x, y)
    return createBox(board, {
        size: BOXSIZE,
        content: `${date}`,
        position,
        parent
    })
}

// /**
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

/**
 * 
 * Compares the "compare" value against all numbers in the array
 * @param {number[]} arr A sorted array
 * @param {number} compare A value to compare against
 * @returns {number} The index it would take as if it was part of the sorted array
 */
function idxInSortedArray(arr, compare) {
    const idx = arr.findIndex(value => compare < value)
    return idx === -1 ? arr.length : idx
}

/**
 * 
 * @param {ShapeItem[]} items Array of items
 * @param {number} [startingFrom=0] The starting index to shift items
 * @param {number} [times=1] How many times to shift
 */
function rightShiftItems(items, startingFrom = 0, times = 1) {
    return items.filter((_, idx) => idx >= startingFrom).map(item =>
        item.update({ position: { x: (item.position?.x ?? 0) + times * BOXSIZE } })
    )
}

/**
 * @param {FrameItem} frame 
 * @param {number} [startingFrom=0] The starting index to shift items
 * @param {number} [times=1] How many times to shift
 */
async function rightShiftStickys(frame, startingFrom = 0, times = 1) {
    return Promise.all((await filterItems(frame, "sticky_note"))
        .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0))
        .filter((_, idx) => idx >= startingFrom)
        .map(note => note.update({ position: { x: (note.position?.x ?? 0) + times * BOXSIZE } }))
    )
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

    date.setDate(newDate)

    const row = Math.floor(newDate / 7)
    const rows = items.map(num => Math.floor(num / 7))

    if (rows.includes(row)) return day

    rows.sort((a, b) => a - b)

    const first = rows[0], last = rows[rows.length - 1]
    if (row < first) await downShiftAll(frame, first - row)
    await increaseFrameHeight(frame, row < first ? first - row : row - last)
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
        geometry: { height: 5 * BOXSIZE, width: 7 * BOXSIZE }
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