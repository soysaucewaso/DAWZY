import sounddevice as sd
import wave
import queue
import sys

# Settings
filename = "output.wav"
if len(sys.argv) > 1:
    filename = sys.argv[1]
sample_rate = 22050
channels = 1

# Thread-safe queue for incoming audio chunks
q = queue.Queue()

def callback(indata, frames, time, status):
    if status:
        print(status, file=sys.stderr)
    q.put(indata.copy())

# Open the output WAV file
wf = wave.open(filename, 'wb')
wf.setnchannels(channels)
wf.setsampwidth(2)  # 16-bit PCM
wf.setframerate(sample_rate)

print("🎤 Recording started. Press Ctrl+C to stop.")

try:
    with sd.InputStream(samplerate=sample_rate, channels=channels, dtype='int16', callback=callback):
        while True:
            wf.writeframes(q.get())
except KeyboardInterrupt:
    print("\n🛑 Recording stopped by user.")
finally:
    wf.close()
    print(f"✅ Recording saved to {filename}")

