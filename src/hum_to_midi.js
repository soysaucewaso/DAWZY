import subprocess from 'node:child_process';
import { promisify } from 'util';
const exec = promisify(subprocess.exec);
export async function humToMIDI(){
    await exec('rm ./input_basic_pitch.mid')
    // basic pitch is installed with pip install basic-pitch
    await exec('basic-pitch . ./input.wav');

    await exec('python add_midi.py /Users/sawyer/development/electron/Dawzy-chatbot/input_basic_pitch.mid')
    console.log('inserted successfully')
}
