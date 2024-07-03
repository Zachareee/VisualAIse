import _ from "lodash"
import { Board, FrameItem, ShapeItem } from "@mirohq/miro-api"
import { createBox, createFrame, filterItems, findItem } from "../miroutils.mjs"

const CalendarFrameName = "Calendar"
const BOXSIZE = 300

class VCalendar {
    /**
     * 
     * @param {Board} board 
     * @param {Record<string, string>} array 
     */
    async prepareCalendar(board, array) {
        const [requiredMin, requiredMax] = getRange(Object.keys(array).map(num => Number(num)))
        if (!requiredMin) return

        const calendarframe = await findItem(board, CalendarFrameName, "frame")
        if (!calendarframe) {
            return createCalendar(board, requiredMin, requiredMax)
        }

        const items = await getUnmodifiedItemsFromFrame(calendarframe)
        /**
         * 
         * @param {ShapeItem} item 
         * @returns 
         */
        function getDate(item) {
            return Number(item.data?.content)
        }
        items.sort((a, b) => getDate(a) - getDate(b))
        const [min, max] = [getDate(items[0]), getDate(items[items.length - 1])]

        if (min) {
            if (requiredMin < min) { }
            if (requiredMax > max) { }
        } else {

        }
    }
}

/**
 * @typedef {[number, number]} Range
 */

/**
 * 
 * @param {number[]} numarr 
 * @returns {Range}
 */
function getRange(numarr) {
    numarr.sort((a, b) => a - b)
    return [_.first(numarr) ?? 0, _.last(numarr) ?? 0]
}

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
 * 
 * @param {Board} board 
 * @param {FrameItem} frame 
 * @param {number} required 
 * @param {ShapeItem} closestItem 
 */
async function createDates(board, frame, required, closestItem) {
    const date = Number(closestItem.data?.content)
    if (required < date) {
        for (let i = 0; i < date - required; i++) {
            createBox(board, {
                size: BOXSIZE,
                content: `${i}`,
                position: {
                    x: BOXSIZE * (i + 0.5),
                    y: BOXSIZE / 2
                },
                parent: frame
            })
        }
    }
}

/**
 * @param {Board} board
 * @param {number} min 
 * @param {number} max 
 */
async function createCalendar(board, min, max) {
    // const days = 31
    // const width = 7 * BOXSIZE, height = Math.ceil(days / 7) * BOXSIZE
    const count = max - min + 1
    const width = count * BOXSIZE, height = BOXSIZE
    // const x = width / 2 - 0.5 * BOXSIZE, y = height / 2 - 0.5 * BOXSIZE

    // calendar
    const frame = await createFrame(board, {
        title: CalendarFrameName,
        bgColor: "#ffcee0",
        position: { x: 0, y: 0 },
        geometry: { height, width }
    })

    console.log("items is empty, initialising calendar...")
    for (let i = 0; i < count; i++) {
        console.log("Currently i is at", i + min)
        createBox(board, {
            size: BOXSIZE,
            content: `${i + min}`,
            position: {
                x: BOXSIZE * (i + 0.5),
                y: BOXSIZE / 2
            },
            parent: frame
        })
    }

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