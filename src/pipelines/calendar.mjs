import { FrameItem } from "@mirohq/miro-api";
import { imp } from "../aiutils.mjs";
import { createFrame, createBox, createStickyNote, findItem } from "../miroutils.mjs";
import { FrameChanges } from "@mirohq/miro-api/dist/api";

const CalendarFrameName = "Calendar"

/**
 * 
 * @param {Board} board 
 * @param {string} content 
 */
export function calendar(board, content) {
    const calendar = await(
        findItem(board, CalendarFrameName, FrameChanges.TypeEnum.Freeform, "title")
        || createCalendar(board))

    decideCalendar(board, content)
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
 * @param {string} board 
 * @param {Record<string, string>} array 
 */
function addDatesToBoard(board, array, calendarframe) {
    Object.entries(array).forEach(([day, activity]) => {
        findItem(board, day, "shape").then(square => {
            console.log("Selected square:", JSON.stringify(square))
            const { position } = square
            createStickyNote(board, { content: activity, position })
        })
    })
}

/**
 * @param {Board} board
 */
export async function createCalendar(board) {
    const size = 300
    const days = 31
    const width = 7 * size, height = Math.ceil(days / 7) * size
    const x = width / 2 - 0.5 * size, y = height / 2 - 0.5 * size

    // calendar
    const calendar = await createFrame(board, {
        title: CalendarFrameName,
        bgColor: "#ffcee0",
        position: { x, y },
        geometry: { height, width }
    })

    for (let i = 0; i < days; i++)
        createBox(board, {
            size, content: `${i + 1}`,
            position: {
                x: size * (i % 7),
                y: size * Math.trunc(i / 7)
            }, parent: calendar.id
        })

    // list
    // createFrame(board, {
    //     title: "Places",
    //     bgColor: "#f5f6f8",
    //     position: { x: width + size, y },
    //     geometry: { width: size, height }
    // })
}