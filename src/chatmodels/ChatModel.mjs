class ChatModel {
    /**
     * 
     * @param {import("../AIutils.mjs").SYSTEMSTRUCT} system 
     * @returns {(content: string) => Promise<string>}
     */
    createModel(system) {
        throw new Error("Not implemented")
    }
}

export default ChatModel