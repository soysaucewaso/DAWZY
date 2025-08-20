import asyncio
from typing import Optional
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from openai import OpenAI
from dotenv import load_dotenv
import json
import os

load_dotenv()  # load environment variables from .env


class MCPClient:
    def __init__(self):
        # Initialize session and client objects
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

        openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai = OpenAI(api_key=openai_api_key,
        # base_url="https://api.deepinfra.com/v1/openai"
        )

    async def connect_to_server(self, server_script_path: str):
        """Connect to an MCP server

        Args:
            server_script_path: Path to the server script (.py or .js)
        """
        is_python = server_script_path.endswith('.py')
        is_js = server_script_path.endswith('.js')
        if not (is_python or is_js):
            raise ValueError("Server script must be a .py or .js file")

        command = "python" if is_python else "node"
        server_params = StdioServerParameters(
            command=command,
            args=[server_script_path],
            env=None
        )

        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))

        await self.session.initialize()

        # List available tools
        response = await self.session.list_tools()
        tools = response.tools
        # print("\nConnected to server with tools:", [tool.name for tool in tools])

    async def process_messages(self, messages: dict) -> str:
        """Process a query using OpenAI and available tools"""

        response = await self.session.list_tools()
        available_tools = [{
            "type": "function",
            "function": {
                "name": tool.name,
                "description": tool.description,
                "parameters": tool.inputSchema
            }
        } for tool in response.tools]
        # print(available_tools)
        # model_name = "Qwen/Qwen3-Coder-480B-A35B-Instruct"
        model_name = 'gpt-5'
        # model_name = "Qwen/Qwen3-235B-A22B-Instruct-2507"
        # Initial OpenAI API call
        response = self.openai.chat.completions.create(
            model=model_name,
            messages=messages,
            tools=available_tools,
            tool_choice="auto",
        )

        # Process response and handle tool calls
        final_text = []

        while True:
            reply = response.choices[0].message

            if reply.content and not reply.tool_calls:
                final_text.append(reply.content)
                messages.append({
                    "role": "assistant",
                    "content": reply.content
                })

            if reply.tool_calls:
                # Add the assistant message that triggered the tool calls
                messages.append({
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "id": tool_call.id,
                            "type": "function",
                            "function": {
                                "name": tool_call.function.name,
                                "arguments": tool_call.function.arguments
                            }
                        }
                        for tool_call in reply.tool_calls
                    ]
                })

                # print(len(reply.tool_calls))
                # print(reply.tool_calls)
                for tool_call in reply.tool_calls:
                    tool_name = tool_call.function.name
                    tool_args = tool_call.function.arguments

                    # Execute tool call
                    parsed_args = json.loads(tool_args)
                    result = await self.session.call_tool(tool_name, parsed_args)
                    # final_text.append(f"[Calling tool {tool_name} with args {parsed_args}]")
                    if isinstance(result.content, list):
                        tool_output_str = "\n".join(
                            item.text for item in result.content if getattr(item, "type", None) == "text"
                        )
                    else:
                        tool_output_str = str(result.content)

                    # Add tool response message
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": tool_name,
                        "content": tool_output_str,
                    })

                # Get next response from OpenAI
                response = self.openai.chat.completions.create(
                    model=model_name,
                    messages=messages,
                )
            else:
                break

        return "\n".join(final_text)

    async def chat_loop(self):
        """Run an interactive chat loop"""
        print("\nMCP Client Started!")
        print("Type your queries or 'quit' to exit.")

        while True:
            try:
                query = input("\nQuery: ").strip()

                if query.lower() == 'quit':
                    break

                response = await self.process_query(query)
                print("\n" + response)

            except Exception as e:
                print(f"\nError: {str(e)}")

    async def cleanup(self):
        """Clean up resources"""
        await self.exit_stack.aclose()
