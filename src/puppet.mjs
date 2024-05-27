import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

const stealth = StealthPlugin()
stealth.enabledEvasions.delete("iframe.contentWindow")
stealth.enabledEvasions.delete("media.codecs")
puppeteer.use(stealth)

const screenshotFolder = "screenshots"
const headless = true;

(async () => {
    const browser = await puppeteer.launch({
        headless
    })
    const page = await browser.newPage()

    const url = "https://miro.com/app/board/uXjVKKKXSG0=/"
    await page.goto(url).then(res => {
        if (url !== res.url()) throw new Error("Please make your miro board public")
    })

    await page.setViewport({ width: 1920, height: 1080 });

    // fit screen to window
    await click(page, "button[data-testid='canvas-controls-zoom-fit']")

    console.log("Taking screenshot")
    await page.screenshot({ path: `${screenshotFolder}/ss.png` })

    await browser.close();
})()

async function click(page, selector, options) {
    console.log("Clicking", selector)
    return select(page, selector, options).then(elem => elem.click())
}

function select(page, selector, options) {
    return page.waitForSelector(selector, { ...options, timeout: options?.timeout ?? 30000 })
}