-- Define the melody: {pitch (MIDI note number), start time in seconds, duration}
local melody = {
  {65, 0.0, 1.0},   -- F4 (root of F minor)
  {68, 1.0, 1.0},   -- G#4 (minor third)
  {72, 2.0, 2.0},   -- C5 (fifth, sustained - part of Fm and F/C)
  {64, 4.0, 0.5},   -- E4 (Fdim root tone)
  {67, 4.5, 0.5},   -- G4 (adds tension - part of Fdim or passing tone)
  {65, 5.0, 1.0},   -- F4 (return to root)
  {60, 6.0, 2.0},   -- C4 (bass of F/C)
  {63, 8.0, 1.0},   -- D#4 (dissonant coloring - haunting)
  {68, 9.0, 1.0},   -- G#4 (minor third again)
  {65, 10.0, 2.0},  -- F4 (anchor)
  {72, 12.0, 4.0},  -- C5 (long sustain to create ambient tail)
}

function add_fx(track, fx_name)
    local fx_index = reaper.TrackFX_AddByName(track, fx_name, false, 1)
    if fx_index == -1 then
        reaper.ShowConsoleMsg("⚠️ Could not find FX: " .. fx_name .. "\n")
    end
end

-- Create a new track
reaper.InsertTrackAtIndex(reaper.CountTracks(0), true)
local track = reaper.GetTrack(0, reaper.CountTracks(0) - 1)
reaper.GetSetMediaTrackInfo_String(track, "P_NAME", "Melody", true)

-- Add a new MIDI item to the track
local item_length = 16.0  -- total item length in seconds
local midi_item = reaper.CreateNewMIDIItemInProj(track, 0, item_length, false)
local take = reaper.GetActiveTake(midi_item)

-- Insert each note into the MIDI take
for _, note in ipairs(melody) do
  local pitch = note[1]
  local start = note[2]
  local duration = note[3]
  local end_pos = start + duration
  reaper.MIDI_InsertNote(take, false, false, 
    reaper.MIDI_GetPPQPosFromProjTime(take, start),
    reaper.MIDI_GetPPQPosFromProjTime(take, end_pos),
    0, pitch, 100, false)
end

add_fx(track, 'ReaSynth (Cockos)')
-- Finalize
reaper.MIDI_Sort(take)
reaper.UpdateArrange()

