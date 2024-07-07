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
        const [min, max] = getRange(items.map(item => Number(item.data?.content)))

        if (min) {
            if (requiredMin < min) {
                createDatesExtendFrame(board, calendarframe, requiredMin, min - requiredMin, 0)
            }
            if (requiredMax > max) {
                createDatesExtendFrame(board, calendarframe, max + 1, requiredMax - max, requiredMax - max)
            }
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
 * @param {number} from 
 * @param {number} count 
 * @param {number} start
 */
async function createDatesExtendFrame(board, frame, from, count, start) {
    await optionalExtendFrame(frame, count, Boolean(start))
    return createDatesNoExtendFrame(board, frame, from, count, start)
}

/**
 * 
 * @param {Board} board 
 * @param {FrameItem} frame 
 * @param {number} from 
 * @param {number} count 
 * @param {number} start
 */
async function createDatesNoExtendFrame(board, frame, from, count, start) {
    for (let i = 0; i < count; i++) {
        const date = i + from
        console.log("Currently i is at", date)
        createBox(board, {
            size: BOXSIZE,
            content: `${date}`,
            position: {
                x: BOXSIZE * (i + start + 0.5),
                y: BOXSIZE / 2
            },
            parent: frame
        })
    }
}

/**
 * 
 * @param {FrameItem} frame 
 * @param {number} count 
 * @param {boolean} noshift 
 */
async function optionalExtendFrame(frame, count, noshift) {
    return frame.update({ geometry: { width: (frame.geometry?.width ?? 0) + count * BOXSIZE } }).then(
        async () => {
            if (!noshift) {
                const items = await getUnmodifiedItemsFromFrame(frame)
                return Promise.all(items.map(item => {
                    const x = item.position?.x ?? 0
                    return item.update({ position: { x: x + count * BOXSIZE } })
                }))
            }
        }
    )
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
    createDatesNoExtendFrame(board, frame, min, max - min + 1, 0)

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