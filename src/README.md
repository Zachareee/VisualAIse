# The source code
The entire logic of the agent sits here
## index.mjs
Setup of routing is done here, most of the logic is attached to the path routing
## AIUtils.mjs
Everything related to AI is done here, including the hooking of prompts to commands on the `imp` object
## Logger.mjs
A convenience method for _presentation mode_ when `PRESENT=true`
## miroutils.mjs
Contains convenience functions to interact with the Miro board, like `createStickyNote`, `findItem` and `updateFrameGeo`
## State.mjs
A thread-safe(kinda) state object which waits for modifications to complete before returning values
## Storage.mjs
Token storage, don't worry about it
