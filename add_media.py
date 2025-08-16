import reapy
import sys
media_filename = sys.argv[1]
print(media_filename)
reapy.reascript_api.InsertMedia(media_filename, -1)
track = reapy.reascript_api.GetTrack(0, reapy.reascript_api.CountTracks(0) - 1)
reapy.reascript_api.TrackFX_AddByName(track, 'ReaSynth (Cockos)', False, -1)
