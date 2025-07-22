This application uses REAScripts to interact with the REAPER DAW.

It uses OpenAI to dynamically generate lua scripts to perform actions in REAPER.

## Setup

1. Install REAPER
2. Enable REAPy: https://linuxtut.com/en/1ed11c09495d952e578d/
3. Add scripts as actions to REAPER
    - Actions -> Show Actions List -> Load ReaScript
    - Add ./Scripts/get_state.lua and ./Scripts/dynamic.lua
4. Copy script command IDs from REAPER to chat.py
    - Actions -> Show Actions List
    - Search for "get_state" and "dynamic"
    - Right Click -> Copy selected action command ID
    - Paste in run_get_state() and run_dynamic_lua_script()
5. `npm i`

## Running
`npm start`
Navigate to REAPER window, and hit screenshot after entering a prompt
