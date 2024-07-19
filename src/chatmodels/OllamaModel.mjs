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
     * @param {import('../aiutils.mjs').SYSTEMSTRUCT} system 
     * @returns {(content: string) => Promise<string>}
     */
    createModel({prompt, temperature}) {
        return content => this.ollama.chat({
            model,
            messages: [{ role: "system", content: prompt }, { role: "user", content: `#INPUT\n${content}\n#OUTPUT` }],
            options: {
                temperature
            }
        }).then(data => data.message.content)
    }
}

export default OllamaModel