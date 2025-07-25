from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

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
            lua_output = f.read()
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
    with open('buffer.txt', 'w') as f:
        f.write('called')
    set_param(track_index, fx_index, param_index, target_value)
    # return f"Set FX {fx_index}, Param {param_index} to value {target_value}."

@mcp.tool()
def add_fx(track_index: int, fx_name: str, record_fx: bool):
    """
    Add an FX to a track

    Args:
        track_index: Index of the Track
        fx_name: Name of the FX to add
        record_fx: True for pre-fader, False for post-fader 
    """
    track = reapy.reascript_api.GetTrack(0, 0)
    fx_index = reapy.reascript_api.TrackFX_AddByName(track, fx_name, record_fx, -1)

    # Insert your logic here (e.g., REAPER API bridge)
    # return f"Set FX {fx_index}, Param {param_index} to value {target_value}."
    return fx_index

@mcp.resource("resource://state")
def get_project_state() -> str:
    with reapy.inside_reaper():
        cid = reapy.reascript_api.NamedCommandLookup('_RS61e36837be3b165b26ecbb73bd32311cfaaea9ac')
        reapy.reascript_api.Main_OnCommand(cid, 0)

    return run_get_state()



# Start the server using stdio
if __name__ == "__main__":
    mcp.run(transport="stdio")

