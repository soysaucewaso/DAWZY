import reapy
import os
import sys
from openai import OpenAI
import re

if len(sys.argv) != 2:
    print('Required Arguments: user message')

user_msg = sys.argv[1]
# Run it
def run_get_state():
    with reapy.inside_reaper():
        cid = reapy.reascript_api.NamedCommandLookup('_RS61e36837be3b165b26ecbb73bd32311cfaaea9ac')
        reapy.reascript_api.Main_OnCommand(cid, 0)


def run_dynamic_lua_script():
    with reapy.inside_reaper():
        cid = reapy.reascript_api.NamedCommandLookup('_RS44e86f1c5f16ad463c82c9042167c56c79599d54')
        reapy.reascript_api.Main_OnCommand(cid, 0)


run_get_state()

path = '/Users/sawyer/development/python/DAWZY_lua/get_state_output.txt'
# Read the result
if not os.path.exists(path):
    print("Lua output file not found.")
    exit(0)
with open(path, "r") as f:
    lua_output = f.read()

openai_api_key = os.getenv("OPENAI_API_KEY")

msg = f"""
Instructions:
You are a REAPER ReaScript assistant that helps users understand and manipulate audio using Lua scripts.

Always respond with a short natural language explanation first. If the users makes a request which you could write a lua script to automate, also include a lua ReaScript code block using lua's ReaScript API (reaper.GetTrack(0, 0)).

If Lua code is appropriate, include it inside a ```lua code block``` after the explanation.

For FX params like gain with Decibel units, with range (min, max), set the param to value v with reaper.TrackFX_SetParam(track, fx_index, param_index, log(v)/(log(max)-log(min)))
Respond only with lua ReaScript code to fulfill the user's request.

State:
{lua_output}

Query: {user_msg}
"""
response = OpenAI(api_key=openai_api_key).chat.completions.create(
    model="gpt-4.1-mini",  # or "gpt-3.5-turbo" for faster/cheaper
    messages=[
        {"role": "user", "content": msg}
    ]
)
output = response.choices[0].message.content

lua_match = re.search(r"```lua(.*?)```", output, re.DOTALL)
if lua_match:
    lua_code = lua_match.group(1).strip()
else:
    lua_code = None

explanation = re.sub(r"```lua.*?```", "", output, flags=re.DOTALL).strip()

print(explanation)
path = '/Users/sawyer/Library/Application Support/REAPER/Scripts/dynamic.lua'
with open(path, 'w') as f:
    f.write(lua_code)


run_dynamic_lua_script()
