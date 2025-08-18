import fs from 'fs';
import OpenAI from 'openai';

import path from 'path';

import { spawn } from 'child_process';

let recordingProcess = null;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


/**
 * Start recording from the microphone to a file.
 * @param {string} filename - Output audio file path
 */
export function startRecording(filename = 'input.wav') {
  if (recordingProcess) {
    console.log("⚠️ Recording is already running.");
    stopRecording();
  }
  const recordScript = path.join(process.cwd(), 'ReaPy_Utils', 'record.py');
  recordingProcess = spawn('python', [recordScript, filename]);
  console.log("🎤 Recording started (Python subprocess).");
}

/**
 * Stop the current recording.
 */
export function stopRecording() {
  if (!recordingProcess) {
    console.log("⚠️ No recording in progress.");
    return;
  }

  // Kill the Python process
  recordingProcess.kill('SIGINT'); // Sends Ctrl+C-like signal
  console.log("🛑 Sent stop signal to recording process.");
  recordingProcess = null;
}

/**
 * Transcribe an existing audio file using OpenAI Whisper API.
 * @param {string} filename - Path to the audio file
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeFromMic(filename = 'input.wav') {
  console.log('🔍 Transcribing:', filename);
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filename),
      model: 'whisper-1'
    });
    const text = transcription.text.trim();
    console.log('📝 Transcription:', text);
    return text;
  } catch (err) {
    console.error('❌ Transcription failed:', err);
    throw err;
  }
  //file.end()
  //file = null;
}

/**
 * Cleanup speech recognition resources.
 * Deletes last recorded file if it exists and resets state.
 */
export function cleanupSpeechRecognition() {
  if (recordingProcess){
    recordingProcess.kill('SIGINT');
    recordingProcess = null;
  }
}
