import { Ollama } from 'ollama'
import ChatModel from './ChatModel.mjs'

const { host } = process.env
const model = "codellama:7b"

/**
 * @property {Ollama} ollama
 */
class OllamaModel extends ChatModel {
    constructor() {
        super()
        this.ollama = new Ollama({ host })
    }

    /**
     * 
     * @param {string} system 
     * @returns {(content: string) => Promise<string>}
     */
    createModel(system) {
        return content => this.ollama.chat({
            model,
            messages: [{ role: "system", content: system }, { role: "user", content: `#INPUT\n${content}\n#OUTPUT` }],
        }).then(data => data.message.content)
    }
}

export default OllamaModel