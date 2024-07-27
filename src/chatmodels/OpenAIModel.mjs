import OpenAI from 'openai'
import ChatModel from './ChatModel.mjs'

class OpenAIModel extends ChatModel {
    constructor() {
        super()
        this.openai = new OpenAI()
    }

    /**
     * 
     * @param {import('../AIutils.mjs').SYSTEMSTRUCT} system 
     * @returns {(content: string) => Promise<string>}
     */
    createModel({prompt, temperature}) {
        return content => this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }, { role: "user", content: `#INPUT\n${content}\n#OUTPUT` }],
            temperature
        }).then(data => data.choices[0]?.message?.content ?? "")
    }
}

export default OpenAIModel