import os
from qwen_agent.agents import Assistant
from qwen_agent.gui import WebUI

# Define the agent with Qwen 3 and MCP configuration
def init_agent_service():
    llm_cfg = {
        'model': 'qwen3-32b',  # Use Qwen 3 model
        'model_type': 'qwen_dashscope',
        'api_key': os.getenv('DASHSCOPE_API_KEY'),
    }
    tools = [{
        'mcpServers': {
            'reaperhelper': {
                'command': 'python',
                'args': ['mcpserver.py']
            }
        }
    }]
    bot = Assistant(
        llm=llm_cfg,
        function_list=tools,
        name='REAPER Helper',
        description='This bot can answer questions by REAPER'
    )
    return bot

# Test the agent with a query
def test(query='How many tracks are in the project?'):
    bot = init_agent_service()
    messages = [{'role': 'user', 'content': query}]
    for response in bot.run(messages=messages):
        print(response)

# Run a web UI for interactive testing
def app_gui():
    bot = init_agent_service()
    WebUI(bot).run()

if __name__ == '__main__':
    test()
    # Uncomment to run the web UI
    # app_gui()