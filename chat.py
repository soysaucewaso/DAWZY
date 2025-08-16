import reapy
import os
import sys
from openai import OpenAI
import re
import asyncio

from mcpclient import MCPClient

if len(sys.argv) != 2:
    print('Required Arguments: user message')

user_msg = sys.argv[1]
# Run it
def run_get_state():
    with reapy.inside_reaper():
        cid = reapy.reascript_api.NamedCommandLookup('_RS61e36837be3b165b26ecbb73bd32311cfaaea9ac')
        reapy.reascript_api.Main_OnCommand(cid, 0)

        path = '/Users/sawyer/development/electron/Dawzy-chatbot/get_state_output.txt'
        # Read the result
        if not os.path.exists(path):
            print("Lua output file not found.")
            exit(0)
        with open(path, "r") as f:
            lua_output = f.read()
        return lua_output


def run_dynamic_lua_script():
    with reapy.inside_reaper():
        cid = reapy.reascript_api.NamedCommandLookup('_RS44e86f1c5f16ad463c82c9042167c56c79599d54')
        reapy.reascript_api.Main_OnCommand(cid, 0)


async def main():

    lua_output = run_get_state()

    msg = f"""
Instructions:
    You are a REAPER ReaScript assistant that teaches users audio concepts and helps automate tasks using Lua scripts.

    Your tone should be short, intuitive, and conversational.

    When responding:
    1. Start with a plain-language explanation — think like you're explaining to a curious beginner, not writing an article.
    2. Use simple examples, metaphors, or analogies when helpful. Avoid long blocks of explanation.
    3. Teach one idea at a time. Break down concepts across multiple turns if needed.
    4. If the task can be automated, include a short Lua script inside a ```lua block``` after the explanation — but only if it's helpful and requested.
    5. Don’t include Lua code if the user is adjusting FX parameters — call the set_fx_param tool instead.
    6. ReaScript uses 0-indexing, but the GUI uses 1-indexing. When the user asks for an update to track #1, the ReaScript track index is 0.
    7. FX parameter names and indexes can be found in the state below
    Your goal is to make audio scripting and concepts feel accessible, not overwhelming. Keep answers short, helpful, and easy to follow.

State:
    {lua_output}

Query: {user_msg}
    """
    messages = [
        {
            "role": "user",
            "content": msg
        }
    ]

    client = MCPClient()
    try:
        await client.connect_to_server('mcpserver.py')
        response = await client.process_messages(messages)
    finally:
        await client.cleanup()
    # output = response.choices[0].message.content
    output = response

    lua_match = re.search(r"```lua(.*?)```", output, re.DOTALL)
    if lua_match:
        lua_code = lua_match.group(1).strip()
    else:
        lua_code = None

    explanation = re.sub(r"```lua.*?```", "", output, flags=re.DOTALL).strip()

    print(explanation)
    path = '/Users/sawyer/Library/Application Support/REAPER/Scripts/dynamic.lua'
    if lua_code:
        with open(path, 'w') as f:
            f.write(lua_code)

        run_dynamic_lua_script()

asyncio.run(main())
