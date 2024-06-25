import { Board, FrameItem, ShapeItem } from "@mirohq/miro-api";
import { imp } from "../aiutils.mjs";
import { createFrame, unwrapGenerator, createStickyNote, findItem, boardContainsItem, findText } from "../miroutils.mjs";
import { FrameChanges } from "@mirohq/miro-api/dist/api.js";
import _ from "lodash"

const CalendarFrameName = "Calendar"
const BOXSIZE = 300

/**
 * 
 * @param {Board} board 
 * @param {string} content 
 */
export async function calendar(board, content) {
    const calendar = await (
        findItem(board, CalendarFrameName, FrameChanges.TypeEnum.Freeform)
        || createCalendar(board))

    decideCalendar(board, content, calendar)
}

/**
 * 
 * @param {Board} board 
 * @param {string} content 
 * @param {FrameItem} calendarframe
 */
function decideCalendar(board, content, calendarframe) {
    imp.checkCalendarDates(content).then(result => {
        console.log("Calendar dates found for", content, result)
        if (Boolean(result))
            imp.createJSONDates(content)
                .then(JSON.parse).then(
                    /**
                     * @param {Record<string, string>} JSONarr
                     */
                    JSONarr => {
                        console.log("JSON format of dates:", JSONarr)
                        addDatesToBoard(board, JSONarr, calendarframe)
                    }
                )
    })
}

/**
 * 
 * @param {Board} board 
 * @param {Record<string, string>} array 
 * @param {FrameItem} calendarframe
 */
async function addDatesToBoard(board, array, calendarframe) {
    prepareCalendar(board, array, calendarframe)
    Object.entries(array).forEach(([day, activity]) => {
        findItem(board, day, "shape").then(square => {
            console.log("Selected square:", JSON.stringify(square))
            const { position } = square
            createStickyNote(board, { content: activity, position })
        })
    })
}

/**
 * 
 * @param {Board} board 
 * @param {Record<string, string>} array 
 * @param {FrameItem} calendarframe
 */
async function prepareCalendar(board, array, calendarframe) {
    const items = await getUnmodifiedItemsFromFrame(calendarframe)
    const [min, max] = getRange(items)
    const [requiredMin, requiredMax] = getRange(Object.keys(array))
    if (requiredMin < min) {}
    if (requiredMax < max) {}
}

/**
 * @param {Board} board
 */
async function createCalendar(board) {
    // const days = 31
    // const width = 7 * BOXSIZE, height = Math.ceil(days / 7) * BOXSIZE
    const width = BOXSIZE, height = BOXSIZE
    const x = width / 2 - 0.5 * BOXSIZE, y = height / 2 - 0.5 * BOXSIZE

    // calendar
    return createFrame(board, {
        title: CalendarFrameName,
        bgColor: "#ffcee0",
        position: { x, y },
        geometry: { height, width }
    })

    // for (let i = 0; i < days; i++)
    //     createBox(board, {
    //         size, content: `${i + 1}`,
    //         position: {
    //             x: size * (i % 7),
    //             y: size * Math.trunc(i / 7)
    //         }, parent: calendar.id
    //     })
}

/**
 * 
 * @param {ShapeItem[]} itemarr 
 * @returns {[number, number]}
 */
function getRange(itemarr) {
    const range = []
    itemarr.forEach(shape => range.push(Number(shape.data[findText("shape")])))
    range.sort((a, b) => a - b)
    return [_.first(range), _.last(range)]
}

/** @type {ShapeItem[]}*/
let activeBoard

/**
 * 
 * @param {FrameItem} frame 
 * @returns 
 */
async function getUnmodifiedItemsFromFrame(frame) {
    const newBoard = await unwrapGenerator(frame.getAllItems({ type: "shape" }))

    /** @type {ShapeItem[]} */
    const retainedItems = []
    for (const item of activeBoard) {
        if (boardContainsItem(newBoard, item)) retainedItems.push(item)
    }
    activeBoard = retainedItems

    return retainedItems
}