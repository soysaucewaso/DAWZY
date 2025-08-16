import audiocraft
import sys
model = audiocraft.models.MusicGen.get_pretrained('facebook/musicgen-small')
descriptions = sys.argv[1:]
wav_tensor = model.generate(descriptions, progress=True)

audiocraft.data.audio.audio_write('beat', wav_tensor[0].cpu(), model.sample_rate)