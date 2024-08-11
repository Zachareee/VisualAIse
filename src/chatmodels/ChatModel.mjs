/**
 * A super class specifying what methods to override when adding a new ChatModel
 */
class ChatModel {
    /**
     * 
     * @param {import("./Implementation.mjs").SYSTEMSTRUCT} system
     * @returns {(content: string) => Promise<string>}
     */
    createModel(system) {
        throw new Error("Not implemented")
    }
}

export default ChatModel