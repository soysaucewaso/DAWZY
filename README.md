This application uses ReaScripts to interact with the REAPER DAW.

It uses an LLM to dynamically generate lua scripts to perform actions in REAPER.

Some reproducible queries showcased in our demo are
- “Double first track’s instrument volume, increase the decay, and triple the attack"
- "Open the FX browser for the first track."
- “Duplicate the first track, pitch it up one octave, and blend it in at 20%.”
- “What does attack time do in the first tracks compressor?”

We use Model Context Protocol to let the LLM set FX parameters, get REAPER state, and generate beat.
Our LLM can also run any of the 711 ReaScript API functions through lua code.

## Setup

1. Install REAPER
2. Set up 2 python virtual environments: dawzy-venv and musicgen-venv
3. Source dawzy-venv and `pip install -r requirements.txt`
4. Enable ReaPy for dawzy-venv using the following tutorial: https://linuxtut.com/en/1ed11c09495d952e578d/
5. Add lua scripts as actions to REAPER
    - Actions -> Show Actions List -> Load ReaScript
    - Add ./Lua_ReaScripts/get_state.lua and ./Lua_ReaScripts/dynamic.lua
6. Copy script command IDs from REAPER to chat.py
    - Actions -> Show Actions List
    - Search for "get_state" and "dynamic"
    - Right Click -> Copy selected action command ID
    - Paste in run_get_state() and run_dynamic_lua_script()
7. Source musicgen-venv and `pip install "numpy<2" audiocraft`
8. Replace the python path in the first line of the `generate` function in `mcpserver.py` with the path to /path/to/musicgen-venv/bin/python
9. Source dawzy-venv
10. `npm i`
11. `export OPENAI_API_KEY=''`

## Running
Navigate to REAPER window
`npm start`


## Notes
We also tested with Qwen 480B-A35B(https://huggingface.co/Qwen/Qwen3-Coder-480B-A35B-Instruct), but code quality was lower.
