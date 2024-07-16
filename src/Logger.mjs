const presentMode = process.env.PRESENT === "true"
console.log("Presentation mode:", presentMode)
export default presentMode ? () => { } : console.log 