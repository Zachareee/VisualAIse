import ollama from 'ollama'

await ollama.create({ model: "interpreter", path: "./modelfile.txt" })

export function chat(content) {
    ollama.chat({
        model: "interpreter",
        messages: [{ role: "user", content }]
    }).then(res => res.message.content).then(console.log)
}