# Visualise
Visualise your conversations on Miro

Note: This app requires you to have a Miro App created, ensure you complete all the prerequisites [here](https://developers.miro.com/docs/getting-started-with-oauth#prerequisites)
## Installing
``` bash
npm i
```
## Running
### .env file
_To be safe, just copy and paste `.env` as `.env.dev` and fill in the variables_

The .env.dev file **MUST** have the following variables:
* `IMPLEMENTATION`: (choose between openai || ollama)
    * If `IMPLEMENTATION`=`ollama`
        * `OLLAMA_HOST` is required (hostname of machine hosting ollama)
    * else if `IMPLEMENTATION`=`openai`
        * `OPENAI_API_KEY` is required
* `MIRO_CLIENT_ID`
* `MIRO_CLIENT_SECRET`
#### Optional variables
* `TOKEN_STORE` : Name of the file to keep credentials (default: tokendb.json)
* `PRESENT` : Presentation mode (default: false)
### Run command
``` bash
npm start
```