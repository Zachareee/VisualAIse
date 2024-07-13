import _ from "lodash"
import { Board, FrameItem, ShapeItem } from "@mirohq/miro-api"
import { createBox, createFrame, createStickyNote, filterItems, findItem } from "../miroutils.mjs"
import { BOXSIZE, calendarPosition } from "./Positions.mjs"

const CalendarFrameName = "Calendar"

class VCalendar {
    /**
     * 
     * @param {Board} board 
     * @param {Record<string, string[]>} array 
     */
    async prepareCalendar(board, array) {
        const calendarframe = (await findItem(board, CalendarFrameName, "frame")) || (await createCalendar(board))

        const items = await getUnmodifiedItemsFromFrame(calendarframe)
        for (const [date, topic] of Object.entries(array)) {
            const idx = idxInSortedArray(items.map(item => Number(item.data?.content)), Number(date))
            await extendFrame(calendarframe).then(
                () => Promise.all([rightShiftItems(items, idx), rightShiftStickys(calendarframe, idx)])
            ).then(
                () => addDate(board, calendarframe, { date, topic, idx })
            )
        }
        return calendarframe
        /*const [requiredMin, requiredMax] = getRange(Object.keys(array).map(num => Number(num)))
        if (!requiredMin) return

        const calendarframe = await findItem(board, CalendarFrameName, "frame")
        if (!calendarframe) {
            return createCalendar(board, requiredMin, requiredMax)
        }

        const items = await getUnmodifiedItemsFromFrame(calendarframe)
        const [min, max] = getRange(items.map(item => Number(item.data?.content)))

        if (min) {
            if (requiredMin < min) {
                createDatesExtendFrame(board, calendarframe, requiredMin, min - requiredMin, 0)
            }
            if (requiredMax > max) {
                createDatesExtendFrame(board, calendarframe, max + 1, requiredMax - max, requiredMax - max)
            }
        }*/
    }
}

/**
 * 
 * @param {Board} board 
 * @param {FrameItem} parent 
 * @param {{date: string, topic: string[], idx: number}} param2 
 * @returns 
 */
async function addDate(board, parent, { date, topic, idx }) {
    return Promise.all([
        createBox(board, {
            size: BOXSIZE,
            content: date,
            position: {
                x: BOXSIZE * (idx + 0.5),
                y: BOXSIZE / 2
            },
            parent
        }),
        createStickyNote(board, {
            content: topic.join("\n"),
            position: {
                x: BOXSIZE * (idx + 0.5),
                y: BOXSIZE / 2
            },
            parent
        })
    ])
}

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
 * @param {number} [times=1]
 */
async function extendFrame(frame, times = 1) {
    const width = frame.geometry?.width ?? 0
    return frame.update({ geometry: { width: (width - width % BOXSIZE) + times * BOXSIZE } })
}

/**
 * @typedef {[number, number]} Range
 */

/**
 * 
 * @param {FrameItem} frame 
 * @returns 
 */
async function getUnmodifiedItemsFromFrame(frame) {
    const newBoard = await filterItems(frame, "shape")
    return newBoard.filter(item => item.position?.y === BOXSIZE / 2)
}

/**
 * @param {Board} board
 * @param {number} [min=0]
 * @param {number} [max=0]
 */
async function createCalendar(board, min = 0, max = 0) {
    // const days = 31
    // const width = 7 * BOXSIZE, height = Math.ceil(days / 7) * BOXSIZE
    const count = max - min + 1
    const width = count * BOXSIZE, height = BOXSIZE
    // const x = width / 2 - 0.5 * BOXSIZE, y = height / 2 - 0.5 * BOXSIZE

    // calendar
    const frame = await createFrame(board, {
        title: CalendarFrameName,
        bgColor: "#ffcee0",
        position: calendarPosition,
        geometry: { height, width: 100 }
    })

    console.log("items is empty, initialising calendar...")

    return frame

    // for (let i = 0; i < days; i++)
    //     createBox(board, {
    //         size, content: `${i + 1}`,
    //         position: {
    //             x: size * (i % 7),
    //             y: size * Math.trunc(i / 7)
    //         }, parent: calendar.id
    //     })
}

export default new VCalendar()