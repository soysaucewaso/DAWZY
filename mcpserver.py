from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

import sys
import asyncio
import os
import reapy
import math

def get_param(track_index, fx_index, param_index):
    project = reapy.Project()
    track = project.tracks[track_index]
    params = track.fxs[fx_index].params
    p = params[param_index]
    
    param_name = p.name

    norm = p.normalized

    # Format current, min, and max values
    formatted_curr = norm.format_value(norm)
    formatted_min = norm.format_value(0.0)
    formatted_max = norm.format_value(1.0)

    # Optional: print results
    return param_name, formatted_curr, formatted_min, formatted_max, params


def db_to_slider(db):
    return math.pow(2, db/6)

def formatted_to_num(formatted_value):
    return float(formatted_value.split(' ')[0])

def set_param(track_index, fx_index, param_index, target_value):
    param_name, formatted_curr, formatted_min, formatted_max, params = get_param(track_index, fx_index, param_index)
    param = params[param_index]
    if 'dB' in formatted_curr:
        slider = db_to_slider(target_value)
        # slider_mi, slider_ma = param.range
        # slider = percent * (slider_ma - slider_mi)
        # print(percent)
        # print(slider)
    else:
        true_mi, true_ma = formatted_to_num(formatted_min), formatted_to_num(formatted_max)
        slider_mi, slider_ma = param.range
        percent = (target_value - true_mi) / (true_ma - true_mi)
        slider = percent * (slider_ma - slider_mi)
        print((true_mi, true_ma, slider, percent))
    with open('buffer.txt', 'w') as f:
        f.write('slider: ' + str(slider))
    params[param_index] = slider
    

def run_get_state():
    with reapy.inside_reaper():
        cid = reapy.reascript_api.NamedCommandLookup('_RS61e36837be3b165b26ecbb73bd32311cfaaea9ac')
        reapy.reascript_api.Main_OnCommand(cid, 0)

        path = '/Users/sawyer/development/python/DAWZY_lua/get_state_output.txt'
        # Read the result
        if not os.path.exists(path):
            print("Lua output file not found.")
            exit(0)
        with open(path, "r") as f:
            lua_output = str(f.read())
        return lua_output


# Create an MCP server
mcp = FastMCP("demo-server", version="1.0.0")


# Define the tool
@mcp.tool()
def set_fx_param(track_index: int, fx_index: int, param_index: int, target_value: float):
    """
    Set an FX parameter to a target value.

    Args:
        track_index: Index of the Track
        fx_index: Index of the FX
        param_index: Index of the parameter
        target_value: The value to set
    """
    # Insert your logic here (e.g., REAPER API bridge)
    try:
        set_param(track_index, fx_index, param_index, target_value)

        return f"Successfully set FX {fx_index}, Param {param_index} to value {target_value}."

    except Exception as e:
        return f'Failed to set FX Param: {str(e)}'

'''
@mcp.tool()
def add_fx(track_index: int, fx_name: str):
    """
    Add an FX to a track

    Args:
        track_index: Index of the Track
        fx_name: Name of the FX to add
    """
    if "(Cockos)" not in fx_name:
        fx_name += " (Cockos)"

    track = reapy.reascript_api.GetTrack(0, track_index)
    fx_index = reapy.reascript_api.TrackFX_AddByName(track, fx_name, False, -1)
    msg = f"Added {fx_name} to track {track_index} at fx index {fx_index}"
    if fx_index == -1: 
        msg = f"Failed to add {fx_name} to track {track_index}"
    return msg
'''

@mcp.resource("resource://state")
def get_project_state() -> str:
    with reapy.inside_reaper():
        cid = reapy.reascript_api.NamedCommandLookup('_RS61e36837be3b165b26ecbb73bd32311cfaaea9ac')
        reapy.reascript_api.Main_OnCommand(cid, 0)

    return run_get_state()

    

async def generate(description: str):
    # audiocraft uses a different python environment bc of dep conflicts
    py_path = '/Users/sawyer/miniconda/envs/audiocraft/bin/python'
    beat_path = '/Users/sawyer/development/electron/Dawzy-chatbot/beat.wav'
    process = await asyncio.create_subprocess_exec(
        'rm', beat_path
    )
    await process.communicate()
    process = await asyncio.create_subprocess_exec(
        py_path, 'beat_generation.py', description,
    )

    await process.communicate()
    if os.path.exists(beat_path):
        py_path = sys.executable
        process = await asyncio.create_subprocess_exec(
            py_path, 'add_media.py', beat_path
        )
        await process.communicate()
        return "Successfully generated beat."
    else:
        return "Failed to generate beat."

    
@mcp.tool()
async def generate_beat(description: str):
    """
    Generate a beat with AI and add it to REAPER

    Args:
        description: Description of the beat
    """
    try:
        return await generate(description)
    except Exception as e:
        return f'Failed to generate beat: {str(e)}'

# Start the server using stdio
if __name__ == "__main__":
    mcp.run(transport="stdio")

