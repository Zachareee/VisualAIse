import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

const stealth = StealthPlugin()
stealth.enabledEvasions.delete("iframe.contentWindow")
stealth.enabledEvasions.delete("media.codecs")
puppeteer.use(stealth)

const screenshotFolder = "screenshots"
const box = { x: 0, y: 56, width: 1920, height: 968 }

export default class MiroBrowser {
    static async init() {
        this.page = await puppeteer.launch().then(browser => browser.newPage())
    }

    static async screenshot(boardId, filename = "ss") {
        const page = this.page

        const url = `https://miro.com/app/board/${boardId}/`
        await page.goto(url).then(res => {
            if (url !== res.url()) throw new Error("Please make your miro board public")
        })

        await page.setViewport({ width: 1920, height: 1080 });

        // fit screen to window
        await click(page, "button[data-testid='canvas-controls-zoom-fit']")

        console.log("Taking screenshot")
        await page.screenshot({ path: `${screenshotFolder}/${filename}.png`, clip: box })
    }

    static async close() {
        await this.page.browser().close()
    }
}

MiroBrowser.init()

async function click(page, selector, options) {
    console.log("Clicking", selector)
    return select(page, selector, options).then(elem => elem.click())
}

function select(page, selector, options) {
    return page.waitForSelector(selector, { ...options, timeout: options?.timeout ?? 30000 })
}