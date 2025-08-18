This application uses ReaScripts to interact with the REAPER DAW.

It uses an LLM to dynamically generate lua scripts to perform actions in REAPER.

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
8. Source dawzy-venv
9. `npm i`

## Running
`npm start`
Navigate to REAPER window, and hit screenshot after entering a prompt
