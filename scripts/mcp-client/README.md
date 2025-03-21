# MCP Client for MCPControl

This is a minimal Model Context Protocol (MCP) client designed to connect to the MCPControl server and run automation scripts. It allows Claude to execute automation workflows by providing a script file in JSON format.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Build the client:
   ```
   npm run build
   ```

## Usage

Run the client by providing the path to the MCPControl server executable:

```
node dist/index.js /path/to/MCPControl [script.json]
```

- `/path/to/MCPControl`: The path to the MCPControl built executable
- `script.json`: Optional path to a JSON script file containing a list of commands to execute

If no script file is provided, the client will simply connect to the server, retrieve the available tools, and exit.

## Script Format

Scripts are JSON files containing an array of commands to execute in sequence. Each command has the following structure:

```json
{
  "tool": "tool_name",
  "args": {
    "param1": "value1",
    "param2": "value2"
  },
  "waitMs": 1000
}
```

- `tool`: The name of the tool to call (required)
- `args`: An object containing the tool arguments (optional, defaults to {})
- `waitMs`: Time to wait after executing the command, in milliseconds (optional)

## Example Script

An example script is provided in `example-script.json`:

```json
[
  {
    "tool": "get_screen_size",
    "args": {}
  },
  {
    "tool": "get_cursor_position",
    "args": {}
  },
  {
    "tool": "get_screenshot",
    "args": {
      "grayscale": true,
      "quality": 80,
      "resize": {
        "width": 1024
      }
    }
  },
  {
    "tool": "move_mouse",
    "args": {
      "x": 100,
      "y": 100
    },
    "waitMs": 500
  },
  {
    "tool": "click_mouse",
    "args": {
      "button": "left"
    },
    "waitMs": 500
  },
  {
    "tool": "type_text",
    "args": {
      "text": "Hello from Claude!"
    },
    "waitMs": 500
  }
]
```

## For Claude

When interacting with Claude, you can create a new script JSON file with a series of automation steps you'd like to perform. Claude can then generate the proper script format with the appropriate tool calls and parameters.

To execute a script through Claude, build the client and the main MCPControl application, then have Claude generate a script in JSON format and run it with the client.

## Available Tools

For a full list of available tools, run the client without a script file or check the MCPControl documentation. The main tools include:

- `get_screenshot`: Take a screenshot (with various options)
- `click_at`: Move mouse to coordinates and click
- `move_mouse`: Move the mouse cursor
- `click_mouse`: Click the mouse at current position
- `type_text`: Type text using the keyboard
- `press_key`: Press a specific keyboard key
- `get_clipboard_content`: Get the clipboard content
- `set_clipboard_content`: Set clipboard content

And many more!