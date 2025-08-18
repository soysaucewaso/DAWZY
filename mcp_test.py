import requests

import mcpserver

import asyncio

async def main():
    #print(mcpserver.add_fx(0,'ReaSynth',False))
    print(await mcpserver.generate_beat('hip hop beat with a subtle trumpet melody'))

if __name__ == "__main__":
    asyncio.run(main())
    
# def get_html(url):
#     try:
#         response = requests.get(url)
#         response.raise_for_status()  # Raise exception for HTTP errors
#         return response.text  # HTML content
#     except requests.exceptions.RequestException as e:
#         print(f"Error fetching {url}: {e}")
#         return None

# # Example usage
# # if __name__ == "__main__":
# #     url = ""
# #     html_content = get_html(url)
# #     if html_content:
# #         print(html_content)  # Print the first 1000 characters
