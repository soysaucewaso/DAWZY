import os
import pyautogui

import vlm_query
import sys

if len(sys.argv) < 1:
    print('Provided user msg as input')
    exit(-1)
user_msg = sys.argv[1]
# Ensure the output directory exists
output_dir = os.path.join('assets')
os.makedirs(output_dir, exist_ok=True)

# Full path to save the screenshot
img_path = os.path.join(output_dir, 'screenshot.png')

# Take screenshot
screenshot = pyautogui.screenshot()

# Save to file
screenshot.save(img_path)

# print(f"✅ Screenshot saved to {img_path}")

response = vlm_query.query_vlm(img_path, user_msg)
print(response)

