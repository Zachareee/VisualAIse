import { Ollama } from 'ollama'
import ChatModel from './ChatModel.mjs'

/**
 * @property {Ollama} ollama
 */
class OllamaModel extends ChatModel {
    constructor() {
        super()
        this.ollama = new Ollama({ host: process.env.OLLAMA_HOST })
    }

    /**
     * 
     * @param {import('./Implementation.mjs').SYSTEMSTRUCT} system 
     * @returns {(content: string) => Promise<string>}
     */
    createModel({prompt, temperature}) {
        return content => this.ollama.chat({
            model: "codellama:7b",
            messages: [{ role: "system", content: prompt }, { role: "user", content: `#INPUT\n${content}\n#OUTPUT` }],
            options: {
                temperature
            }
        }).then(data => data.message.content)
    }
}

export default OllamaModel