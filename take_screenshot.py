import os
import pyautogui

# Ensure the output directory exists
output_dir = os.path.join('assets')
os.makedirs(output_dir, exist_ok=True)

# Full path to save the screenshot
output_path = os.path.join(output_dir, 'screenshot.png')

# Take screenshot
screenshot = pyautogui.screenshot()

# Save to file
screenshot.save(output_path)

print(f"✅ Screenshot saved to {output_path}")

