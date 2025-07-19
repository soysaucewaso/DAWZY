import reapy
import os
import sys
from openai import OpenAI

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
State:
{lua_output}

Query: {user_msg}

Instructions:
For FX params like gain with Decibel units, with range (min, max), set the param to value v with reaper.TrackFX_SetParam(track, fx_index, param_index, log(v)/(log(max)-log(min)))
Respond only with lua ReaScript code to fulfill the user's request.
"""
response = OpenAI(api_key=openai_api_key).chat.completions.create(
    model="gpt-4.1-mini",  # or "gpt-3.5-turbo" for faster/cheaper
    messages=[
        {"role": "user", "content": msg}
    ]
)
output = response.choices[0].message.content
output = '\n'.join(output.split('\n')[1:-1])

print(output)
path = '/Users/sawyer/Library/Application Support/REAPER/Scripts/dynamic.lua'
with open(path, 'w') as f:
    f.write(output)


run_dynamic_lua_script()
