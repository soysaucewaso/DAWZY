-- @description Print detailed DAW state: Tracks, FX, Parameters, Notes, Instrument
-- @version 1.1
-- @author ChatGPT

local buffer = {}
function msg(s)
	-- reaper.ShowConsoleMsg(tostring(s) .. "\n")
  table.insert(buffer, tostring(s) .. "\n")

end

msg(reaper.GetOS() .. "\n")
reaper.ClearConsole()

local state = reaper.GetPlayState()

local state_str = {}
if (state & 1) ~= 0 then
	table.insert(state_str, "Playing")
end
if (state & 2) ~= 0 then
	table.insert(state_str, "Paused")
end
if (state & 4) ~= 0 then
	table.insert(state_str, "Recording")
end

msg("Project states: " .. table.concat(state_str, ", ") .. "\n")

msg("current play position: " .. reaper.GetPlayPosition() .. " seconds\n")

local bpm, bpi = reaper.GetProjectTimeSignature2(0)

msg("bpm: " .. bpm .. ", bpi: " .. bpi .. "\n")

local is_repeat = reaper.GetSetRepeat(-1)

msg("Is repeat: " .. is_repeat .. "\n")

local context = reaper.GetCursorContext()

local context_str = ({
	[0] = "Track Panels",
	[1] = "Items",
	[2] = "Envelopes",
})[context] or "Unknown"

msg("Cursor Context: " .. context_str .. "\n")

local track_count = reaper.CountTracks(0)
msg("🎼 Project Track Overview (" .. track_count .. " tracks):\n")

for t = 0, track_count - 1 do
	local track = reaper.GetTrack(0, t)

	local _, track_name = reaper.GetSetMediaTrackInfo_String(track, "P_NAME", "", false)
	if track_name == "" then
		track_name = "(Unnamed Track)"
	end

	msg("Track #" .. (t + 1) .. " with index " .. t .. ": " .. track_name .. "")

	-- local _, buf = reaper.GetTrackStateChunk(track, "", false)
	-- msg("State: " .. buf .. "\n")

	-- Instrument
	local instrument_index = reaper.TrackFX_GetInstrument(track)
	if instrument_index >= 0 then
		local _, inst_name = reaper.TrackFX_GetFXName(track, instrument_index, "")
		msg("  🎹 Instrument: " .. inst_name)
	else
		msg("  🎹 Instrument: (None)")
	end

	-- FX list
	local fx_count = reaper.TrackFX_GetCount(track)
	if fx_count > 0 then
		msg("  🎛 FX Chain:")
		for j = 0, fx_count - 1 do
			local _, fx_name = reaper.TrackFX_GetFXName(track, j, "")
			msg("    ➤ FX with index " .. j .. ": " .. fx_name)

			local param_count = reaper.TrackFX_GetNumParams(track, j)
			for p = 0, param_count - 1 do
				local _, param_name = reaper.TrackFX_GetParamName(track, j, p, "")

        -- remove leading '1: '
        param_name = string.gsub(param_name, "^%d:%s*", "")
				local norm_val = reaper.TrackFX_GetParamNormalized(track, j, p)
				local success, formatted_curr = reaper.TrackFX_FormatParamValueNormalized(track, j, p, norm_val, "")

				local min_success, formatted_min = reaper.TrackFX_FormatParamValueNormalized(track, j, p, 0.0, "")
				local max_success, formatted_max = reaper.TrackFX_FormatParamValueNormalized(track, j, p, 1.0, "")

				msg(
					string.format(
						"        Param with index " .. tostring(p) .. ": %s: %s. Range: (%s to %s)",
						param_name,
						formatted_curr,
						formatted_min,
						formatted_max
					)
				)
			end
		end
	else
		msg("  🎛 FX Chain: (None)")
	end

	local items_count = reaper.CountTrackMediaItems(track)
	for i = 0, items_count - 1 do
		local item = reaper.GetTrackMediaItem(track, i)
		local params = {
			{ key = "B_MUTE", label = "Muted (respects solo state)" },
			{ key = "B_MUTE_ACTUAL", label = "True mute (ignores solo)" },
			{ key = "C_MUTE_SOLO", label = "Solo override (-1=soloed, 1=unsoloed)" },
			{ key = "B_LOOPSRC", label = "Looping source enabled" },
			{ key = "B_ALLTAKESPLAY", label = "All takes play simultaneously" },
			{ key = "B_UISEL", label = "Selected in arrange view" },
			{ key = "C_BEATATTACHMODE", label = "Timebase mode (-1=default, 1=beats, 2=beats pos only)" },
			{ key = "C_AUTOSTRETCH", label = "Auto-stretch with tempo changes" },
			{ key = "C_LOCK", label = "Item locked (bitmask)" },
			{ key = "D_VOL", label = "Item volume (1 = +0dB)" },
			{ key = "D_POSITION", label = "Position in seconds" },
			{ key = "D_LENGTH", label = "Length in seconds" },
			{ key = "D_SNAPOFFSET", label = "Snap offset in seconds" },
			{ key = "D_FADEINLEN", label = "Manual fade-in length (s)" },
			{ key = "D_FADEOUTLEN", label = "Manual fade-out length (s)" },
			{ key = "D_FADEINDIR", label = "Fade-in curve shape (-1 to 1)" },
			{ key = "D_FADEOUTDIR", label = "Fade-out curve shape (-1 to 1)" },
			{ key = "D_FADEINLEN_AUTO", label = "Auto fade-in length (-1 = none)" },
			{ key = "D_FADEOUTLEN_AUTO", label = "Auto fade-out length (-1 = none)" },
			{ key = "C_FADEINSHAPE", label = "Fade-in shape (0 = linear, up to 6)" },
			{ key = "C_FADEOUTSHAPE", label = "Fade-out shape (0 = linear, up to 6)" },
			{ key = "I_GROUPID", label = "Item group ID (0 = none)" },
			{ key = "I_CURTAKE", label = "Active take index" },
			{ key = "IP_ITEMNUMBER", label = "Item's index on its track" },
			{ key = "I_CUSTOMCOLOR", label = "Custom color (native int)" },
			{ key = "F_FREEMODE_Y", label = "Y position in free/fixed lane mode (0 = top)" },
			{ key = "F_FREEMODE_H", label = "Height in free/fixed lane mode (1 = full track)" },
			{ key = "I_FIXEDLANE", label = "Fixed lane index (read-only)" },
			{ key = "B_FIXEDLANE_HIDDEN", label = "Item hidden in lane view" },
		}

		-- Collect and print
		local results = {}
		for _, p in ipairs(params) do
			local val = reaper.GetMediaItemInfo_Value(item, p.key)
			table.insert(results, string.format("%-35s: %s", p.label, tostring(val)))
		end

    msg('Media Item ' .. i)
		-- Output
		msg(table.concat(results, "\n") .. "\n")
	end

	-- Envelopes
	---- Map envelope shape codes to names
	local envelope_shape_names = {
		[0] = "Linear",
		[1] = "Square",
		[2] = "Slow start/end",
		[3] = "Fast start",
		[4] = "Fast end",
		[5] = "Bezier",
		[6] = "Hold",
	}

  local env_cnt = reaper.CountTrackEnvelopes(track)
  if env_cnt == 0 then
    msg("   (no envelopes)")
  end
	for e = 0, env_cnt - 1 do
		local env = reaper.GetTrackEnvelope(track, e)
		local _, env_name = reaper.GetEnvelopeName(env, "")
		local vis = reaper.GetEnvelopeInfo_Value(env, "B_VISIBLE") or reaper.GetEnvelopeInfo_Value(env, "VIS")
		local arm = reaper.GetEnvelopeInfo_Value(env, "B_ARM") or reaper.GetEnvelopeInfo_Value(env, "ARM")
		msg(
			"   • Envelope %d: %s  [Visible: %s | Armed: %s]",
			e + 1,
			env_name,
			vis == 1 and "Yes" or "No",
			arm == 1 and "Yes" or "No"
		)

		-- Envelope points
		local pt_cnt = reaper.CountEnvelopePoints(env)
		if pt_cnt == 0 then
			msg("       (no points)")
		else
			for p = 0, pt_cnt - 1 do
				local ok, pt_time, pt_val, shape, tension, selected = reaper.GetEnvelopePoint(env, p)
				if ok then
					msg(
						"       ▸ Pt %3d | Time %9.3f s | Val %7.4f | %s | Tens %.3f | Sel %s",
						p,
						pt_time,
						pt_val,
						envelope_shape_names[shape] or shape,
						tension,
						selected and "Yes" or "No"
					)
				end
			end
		end
	end
	msg("") -- spacing
end

-- Count number of tempo/time signature markers
local numMarkers = reaper.CountTempoTimeSigMarkers(0)

-- Loop through and print each marker's data
for i = 0, numMarkers - 1 do
	local retval, pos, measurepos, beatpos, bpm, timesig_num, timesig_denom, lineartempo =
		reaper.GetTempoTimeSigMarker(0, i)

	local timeStr = string.format("Time %.3f sec (Measure %.1f)", pos, measurepos)
	local tempoStr = string.format("Tempo: %.2f BPM", bpm)
	local sigStr = string.format("Time Sig: %d/%d", timesig_num, timesig_denom)
	local modeStr = lineartempo and "(Linear)" or "(Instant)"

	-- msg(string.format("Marker %d: %s | %s | %s %s\n", i + 1, timeStr, tempoStr, sigStr, modeStr))
end
local path = '/Users/sawyer/development/electron/Dawzy-chatbot/get_state_output.txt'

local result = table.concat(buffer)
local file = io.open(path, "w")
file:write(result)
file:close()

