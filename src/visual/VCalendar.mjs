import _ from "lodash"
import { Board, FrameItem, ShapeItem } from "@mirohq/miro-api"
import { createBox, createFrame, createStickyNote, createTag, createText, filterItems, findItem, updateFrameGeo } from "../miroutils.mjs"
import { BOXSIZE, calendarPosition, coordinateCalculator, stickySizeReduction, textHeight } from "./Positions.mjs"
import log from "../Logger.mjs"
import { date as originalDate } from "../pipes/Calendar.mjs"
import { PositionChange } from "@mirohq/miro-api/dist/api.js"

/** Changes the frame name */
const CalendarFrameName = "Calendar"

/** The visual counterpart of the Calendar, designed to only manage the visualisation on Miro */
class VCalendar {
    /**
     * The starting point of the visualisation of the calendar
     * @param {Board} board 
     * @param {string} user
     * @param {Record<string, string[]>} array 
     */
    async prepareCalendar(board, user, array) {
        /** Finds any frame with the same name as {@link CalendarFrameName}, otherwise creates a CalendarFrame */
        const calendarframe = (await findItem(board, CalendarFrameName, "frame")) || (await createCalendar(board))

        /** Items created by the agent */
        let items = await getUnmodifiedItemsFromFrame(calendarframe)
        for (const [date, topic] of Object.entries(array)) {
            log("The current date is", date)

            // extends frame if needed
            await extendFrame(calendarframe, items.map(convertShapeToDate), Number(date)).then(
                // fill in the empty spaces between dates with boxes if needed
                day => fillBoxes(board, calendarframe, items, date, day)
            ).then(
                // sort the array and set the items variable
                arr => items = arr.sort((item1, item2) => convertShapeToDate(item1) - convertShapeToDate(item2))
            ).then(
                // add the event to the board as a sticky note
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
 * Get the min and max of a number array
 * @param {number[]} items 
 * @returns {Range}
 */
function getRange(items) {
    const arr = items.sort((a, b) => a - b)
    return [_.first(arr), _.last(arr)]
}

/**
 * Adds the sticky note with the tag containing the username provided
 * @param {Board} board 
 * @param {FrameItem} parent 
 * @param {string} title
 * @param {{ topic: string[], position?: PositionChange}} param2 
 * @returns 
 */
async function addDate(board, parent, title, { topic, position }) {
    // create tag
    return createTag(board, { title }).then(
        // get the id from the tag and
        ({ id }) => createStickyNote(board, {
            parent,
            content: topic.join(', '),
            position: position ?? calculateNotePosition(0, 0),
            size: BOXSIZE - stickySizeReduction
        }).then(
            // use the id to attach to note
            note => note.attachTag(id)
        )
    )
}

/**
 * The formula to determine which absolute row a date belongs to
 * @param {number} date 
 * @param {number} startDay 
 * @returns 
 */
const rowFormula = (date, startDay) => Math.floor((date + startDay - 1) / 7)

/**
 * Fills up missing areas between dates with boxes
 * @param {Board} board 
 * @param {FrameItem} parent 
 * @param {ShapeItem[]} items 
 * @param {string} date
 * @param {number} startDay
 */
async function fillBoxes(board, parent, items, date, startDay) {
    const dates = items.map(convertShapeToDate)
    /**
     * An array of date box creation functions
     * Initially will create just the date
     * @type {Promise<ShapeItem>[]}
     */
    const arr = [createDateBox(board, parent, Number(date), startDay, getRange(dates))]

    // If there are no items, there's no boxes to fill in-between so just return
    if (items.length == 0)
        return Promise.all(arr);

    dates.push(Number(date))
    const datesRange = getRange(dates)

    // Using a reducer to fill boxes between 2 dates
    // basically acts as a "for" loop to get the current and next element to fill in-between
    dates.reduce((accum, current) => {
        // Add every createDateBox to the array so that we can wait for all the functions to complete
        for (let i = accum + 1; i < current; i++) {
            arr.push(createDateBox(board, parent, i, startDay, datesRange))
        }
        return current
    })

    return [...items, ...await Promise.all(arr)]
}

/**
 * Creates a box with the assigned date
 * @param {Board} board 
 * @param {FrameItem} parent 
 * @param {number} date 
 * @param {number} startDay 
 * @param {Range} datesRange 
 */
async function createDateBox(board, parent, date, startDay, datesRange) {
    const x = (date + startDay - 1) % 7
    const y = rowNumber(rowFormula(date, startDay), startDay, datesRange)

    return createBox(board, {
        size: BOXSIZE,
        content: `${date}`,
        position: calculateNotePosition(x, y),
        parent
    })
}

/**
 * Finds the row number relative to the rows currently in the {@link datesRange}
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
 * Increases the size of the frame based on the date being added
 * @param {FrameItem} frame 
 * @param {number[]} items 
 * @param {number} newDate
 */
async function extendFrame(frame, items, newDate) {
    /** Finds which day the month starts on */
    const firstDay = originalDate.getDay()

    // If the date is already on the board, no action is required
    if (items.includes(newDate)) return firstDay

    /** The row number to place the added date */
    const row = rowFormula(newDate, firstDay)
    /** Collects the row numbers  */
    const rows = items.map(num => rowFormula(num, firstDay))

    // If the row exists, no need to expand frame
    if (rows.includes(row)) return firstDay

    rows.sort((a, b) => a - b)

    /**
     * Finds the first and last rows on the current calendar
    */
    const [first, last] = getRange(rows)

    // If rows exist on the current calendar
    if (first != undefined && last != undefined) {
        /** Find the number of rows we need to add */
        const rowCount = row < first ? first - row : row - last
        await increaseFrameHeight(frame, rowCount)
    }

    // If the row we need is above what is currently displayed, we shift everything down to make way for it
    if (first != undefined && row < first) await downShiftAll(frame, first - row)
    return firstDay
}

/**
 * Convenience function to shift items downwards {@link n} times
 * @param {FrameItem} frame 
 * @param {number} n
 */
async function downShiftAll(frame, n) {
    // waits for all functions to complete
    return Promise.all(
        /**
         * Declares all types of elements to shift downwards
         * @type {(keyof import("../miroutils.mjs").Filters)[]}
         */
        (["sticky_note", "shape"]).map(
            filterKey => filterItems(frame, filterKey).then(
                /**
                 * @param arr An array of objects with the {@link filterKey} type
                 */
                arr => Promise.all(arr.map(
                    // updates items' position
                    item => item.update({
                        position: {
                            y: (item.position?.y ?? 0) + BOXSIZE * n
                        }
                    })
                ))
            )
        )
    )
}

/**
 * Basic increasing frame height
 * @param {FrameItem} frame 
 * @param {number} numRows 
 */
async function increaseFrameHeight(frame, numRows) {
    const height = (frame.geometry?.height ?? 0) + numRows * BOXSIZE
    return updateFrameGeo(frame, { height })
}

/**
 * Filters out items which are "aligned" and hence likely not created by a user
 * @param {FrameItem} frame 
 * @returns 
 */
async function getUnmodifiedItemsFromFrame(frame) {
    return (await filterItems(frame, "shape")).filter(boxCentered)
}

/**
 * Checks if a box is "aligned"
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
    /** The calendar frame object on Miro */
    const frame = await createFrame(board, {
        title: CalendarFrameName,
        bgColor: "#ffcee0",
        position: calendarPosition,
        geometry: { height: BOXSIZE + textHeight, width: 7 * BOXSIZE }
    });

    // Creates a text header for each day on the calendar
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        .forEach((content, idx) => createText(board, {
            content,
            parent: frame,
            geometry: {
                width: BOXSIZE
            },
            position: calculateDayPosition(idx, 0)
        }))

    return frame
}

/** Calculates the coordinate of the sticky note based on x and y coordinates */
const calculateNotePosition = coordinateCalculator({ height: BOXSIZE, width: BOXSIZE, yOffset: textHeight })

/** Calculates the coordinate of the day text based on x and y coordinates */
const calculateDayPosition = coordinateCalculator({ height: textHeight, width: BOXSIZE })

export default new VCalendar()