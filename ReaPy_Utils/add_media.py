import reapy
import sys
media_filename = sys.argv[1]
print(media_filename)
reapy.reascript_api.InsertMedia(media_filename, 1)
track_index = reapy.reascript_api.CountTracks(0) - 1
track = reapy.reascript_api.GetTrack(0, track_index)
reapy.reascript_api.TrackFX_AddByName(track, 'ReaSynth (Cockos)', False, -1)
if len(sys.argv) > 2 and sys.argv[2] == 'true':
    project = reapy.Project()
    track = project.tracks[track_index]
    params = track.fxs[0].params
    # set volume to 3 dB
    params[5] = 1.41421356237
