import subprocess from 'node:child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

const exec = promisify(subprocess.exec);

export async function humToMIDI() {
    const inputMidiPath = path.join(projectRoot, 'input_basic_pitch.mid');
    const inputWavPath = path.join(projectRoot, 'input.wav');
    const addMediaScript = path.join(projectRoot, 'ReaPy_Utils', 'add_media.py');
    
    // Clean up previous MIDI file if it exists
    await exec(`rm -f "${inputMidiPath}"`);
    
    // Run basic pitch to generate MIDI from WAV
    await exec(`basic-pitch "${projectRoot}" "${inputWavPath}"`);

    // Add the generated MIDI to the DAW
    await exec(`python "${addMediaScript}" "${inputMidiPath}"`);
    console.log('Inserted MIDI successfully');
}
