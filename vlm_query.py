import base64
from openai import OpenAI
import time

import os

openai_api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=openai_api_key)

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


# Ensure the output directory exists
output_dir = os.path.join('assets')
os.makedirs(output_dir, exist_ok=True)


image_path = os.path.join(output_dir, 'screenshot.png')

def query_vlm(input_path, msg):
    base64_image = encode_image(image_path)


    st= time.time()
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    { "type": "text", "text": msg },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                        },
                    },
                ],
            }
        ],
        max_tokens=100
    )
    # print(time.time()-st)
    return completion.choices[0].message.content
