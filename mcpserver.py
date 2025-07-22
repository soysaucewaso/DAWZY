from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

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
    



# Create an MCP server
mcp = FastMCP("demo-server", version="1.0.0")


# Define the tool
@mcp.tool()
async def set_fx_param(track_index: int, fx_index: int, param_index: int, target_value: float):
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

# Start the server using stdio
if __name__ == "__main__":
    mcp.run(transport="stdio")

