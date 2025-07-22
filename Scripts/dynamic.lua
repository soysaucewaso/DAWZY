-- Get the first track
local track = reaper.GetTrack(0, 0)
-- Convert the target attack value (5 ms) into a normalized parameter
local target_param_value = 5 / 5000 -- Since the range is 0.0 ms to 5000.0 ms
-- Set the parameter
reaper.TrackFX_SetParam(track, 0, 0, target_param_value)