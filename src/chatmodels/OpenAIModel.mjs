import OpenAI from 'openai'
import ChatModel from './ChatModel.mjs'

class OpenAIModel extends ChatModel {
    constructor() {
        super()
        this.openai = new OpenAI()
    }

    /**
     * 
     * @param {string} system 
     * @returns {(content: string) => Promise<string>}
     */
    createModel(system) {
        return content => this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: system }, { role: "user", content: `#INPUT\n${content}\n#OUTPUT` }],
        }).then(data => data.choices[0]?.message?.content ?? "")
    }
}

export default OpenAIModel