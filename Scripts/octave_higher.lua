-- @description Shift selected track up 1 octave using ReaPitch
-- @version 1.0
-- @author ChatGPT

function msg(s) reaper.ShowConsoleMsg(tostring(s) .. "\n") end

reaper.Undo_BeginBlock()

-- Get selected track
local track = reaper.GetSelectedTrack(0, 0)
if not track then
  msg('no track')
  reaper.MB("No track selected.", "Error", 0)
  return
end

-- Insert ReaPitch FX
local fx_index = reaper.TrackFX_AddByName(track, "ReaPitch (Cockos)", false, -1)

if fx_index == -1 then
  msg('no cockos')
  reaper.MB("ReaPitch plugin not found.", "Error", 0)
  return
end

-- Set pitch shift to +12 semitones (1 octave)
-- Parameter 0 is the pitch shift in semitones
reaper.TrackFX_SetParam(track, fx_index, 3, 1)

reaper.Undo_EndBlock("Shift selected track up one octave", -1)

