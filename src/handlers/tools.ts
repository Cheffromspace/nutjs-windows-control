import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  TextContent
} from "@modelcontextprotocol/sdk/types.js";
import { MousePosition, KeyboardInput, KeyCombination, ClipboardInput } from "../types/common.js";
import { 
  moveMouse, 
  clickMouse, 
  doubleClick, 
  getCursorPosition,
  scrollMouse,
  dragMouse,
  setMouseSpeed
} from "../tools/mouse.js";
import { 
  typeText, 
  pressKey,
  pressKeyCombination
} from "../tools/keyboard.js";
import { 
  getScreenSize, 
  getScreenshot, 
  getActiveWindow,
  listAllWindows,
  focusWindow,
  resizeWindow,
  repositionWindow,
  minimizeWindow,
  restoreWindow
} from "../tools/screen.js";
import {
  getClipboardContent,
  setClipboardContent,
  hasClipboardText,
  clearClipboard
} from "../tools/clipboard.js";

export function setupTools(server: Server): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "move_mouse",
        description: "Move the mouse cursor to specific coordinates",
        inputSchema: {
          type: "object",
          properties: {
            x: { type: "number", description: "X coordinate" },
            y: { type: "number", description: "Y coordinate" }
          },
          required: ["x", "y"]
        }
      },
      {
        name: "click_mouse",
        description: "Click the mouse at the current position",
        inputSchema: {
          type: "object",
          properties: {
            button: { 
              type: "string", 
              enum: ["left", "right", "middle"],
              default: "left",
              description: "Mouse button to click" 
            }
          }
        }
      },
      {
        name: "drag_mouse",
        description: "Drag the mouse from one position to another",
        inputSchema: {
          type: "object",
          properties: {
            fromX: { type: "number", description: "Starting X coordinate" },
            fromY: { type: "number", description: "Starting Y coordinate" },
            toX: { type: "number", description: "Ending X coordinate" },
            toY: { type: "number", description: "Ending Y coordinate" },
            button: { 
              type: "string", 
              enum: ["left", "right", "middle"],
              default: "left",
              description: "Mouse button to use for dragging" 
            }
          },
          required: ["fromX", "fromY", "toX", "toY"]
        }
      },
      {
        name: "set_mouse_speed",
        description: "Set the mouse movement speed (delay in milliseconds)",
        inputSchema: {
          type: "object",
          properties: {
            speed: { 
              type: "number", 
              description: "Mouse movement delay in milliseconds (1-100, lower = faster)",
              minimum: 1,
              maximum: 100
            }
          },
          required: ["speed"]
        }
      },
      {
        name: "scroll_mouse",
        description: "Scroll the mouse wheel up or down",
        inputSchema: {
          type: "object",
          properties: {
            amount: { 
              type: "number", 
              description: "Amount to scroll (positive for down, negative for up)" 
            }
          },
          required: ["amount"]
        }
      },
      {
        name: "type_text",
        description: "Type text using the keyboard",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text to type" }
          },
          required: ["text"]
        }
      },
      {
        name: "press_key",
        description: "Press a specific keyboard key",
        inputSchema: {
          type: "object",
          properties: {
            key: { 
              type: "string",
              description: "Key to press (e.g., 'enter', 'tab', 'escape')" 
            }
          },
          required: ["key"]
        }
      },
      {
        name: "press_key_combination",
        description: "Press multiple keys simultaneously (e.g., keyboard shortcuts)",
        inputSchema: {
          type: "object",
          properties: {
            keys: {
              type: "array",
              items: { type: "string" },
              description: "Array of keys to press simultaneously (e.g., ['control', 'c'])"
            }
          },
          required: ["keys"]
        }
      },
      {
        name: "get_screen_size",
        description: "Get the screen dimensions",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_screenshot",
        description: "Take a screenshot of the current screen",
        inputSchema: {
          type: "object",
          properties: {
            region: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" }
              }
            }
          }
        }
      },
      {
        name: "get_cursor_position",
        description: "Get the current cursor position",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "double_click",
        description: "Double click at current or specified position",
        inputSchema: {
          type: "object",
          properties: {
            x: { type: "number", description: "X coordinate (optional)" },
            y: { type: "number", description: "Y coordinate (optional)" }
          }
        }
      },
      {
        name: "get_active_window",
        description: "Get information about the currently active window",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "list_windows",
        description: "Get a list of all visible windows with their information",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "focus_window",
        description: "Focus a specific window by its title",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title of the window to focus" }
          },
          required: ["title"]
        }
      },
      {
        name: "resize_window",
        description: "Resize a specific window by its title",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title of the window to resize" },
            width: { type: "number", description: "New width of the window" },
            height: { type: "number", description: "New height of the window" }
          },
          required: ["title", "width", "height"]
        }
      },
      {
        name: "reposition_window",
        description: "Move a specific window to new coordinates",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title of the window to move" },
            x: { type: "number", description: "New X coordinate" },
            y: { type: "number", description: "New Y coordinate" }
          },
          required: ["title", "x", "y"]
        }
      },
      {
        name: "minimize_window",
        description: "Minimize a specific window by its title (currently unsupported)",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title of the window to minimize" }
          },
          required: ["title"]
        }
      },
      {
        name: "restore_window",
        description: "Restore a minimized window by its title (currently unsupported)",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title of the window to restore" }
          },
          required: ["title"]
        }
      },
      {
        name: "get_clipboard_content",
        description: "Get the current text content from the clipboard",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "set_clipboard_content",
        description: "Set text content to the clipboard",
        inputSchema: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text to copy to clipboard" }
          },
          required: ["text"]
        }
      },
      {
        name: "has_clipboard_text",
        description: "Check if the clipboard contains text",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "clear_clipboard",
        description: "Clear the clipboard content",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;
      let response;

      switch (name) {
        case "move_mouse":
          if (!isMousePosition(args)) {
            throw new Error("Invalid mouse position arguments");
          }
          response = await moveMouse(args);
          break;

        case "click_mouse":
          response = await clickMouse(
            typeof args?.button === 'string' ? args.button : 'left'
          );
          break;

        case "drag_mouse":
          if (typeof args?.fromX !== 'number' || 
              typeof args?.fromY !== 'number' ||
              typeof args?.toX !== 'number' ||
              typeof args?.toY !== 'number') {
            throw new Error("Invalid drag mouse arguments");
          }
          response = await dragMouse(
            { x: args.fromX, y: args.fromY },
            { x: args.toX, y: args.toY },
            typeof args?.button === 'string' ? args.button : 'left'
          );
          break;

        case "set_mouse_speed":
          if (typeof args?.speed !== 'number') {
            throw new Error("Invalid mouse speed argument");
          }
          response = await setMouseSpeed(args.speed);
          break;

        case "scroll_mouse":
          if (typeof args?.amount !== 'number') {
            throw new Error("Invalid scroll amount argument");
          }
          response = await scrollMouse(args.amount);
          break;

        case "type_text":
          if (!isKeyboardInput(args)) {
            throw new Error("Invalid keyboard input arguments");
          }
          response = await typeText(args);
          break;

        case "press_key":
          if (typeof args?.key !== 'string') {
            throw new Error("Invalid key press arguments");
          }
          response = await pressKey(args.key);
          break;

        case "press_key_combination":
          if (!isKeyCombination(args)) {
            throw new Error("Invalid key combination arguments");
          }
          response = await pressKeyCombination(args);
          break;

        case "get_screen_size":
          response = await getScreenSize();
          break;

        case "get_screenshot":
          const region = args?.region as { x: number; y: number; width: number; height: number; } | undefined;
          response = await getScreenshot(region);
          // If we have image content, return it directly
          if (response.success && response.content) {
            return { content: response.content };
          }
          break;

        case "get_cursor_position":
          response = await getCursorPosition();
          break;

        case "double_click":
          if (args && typeof args.x === 'number' && typeof args.y === 'number') {
            response = await doubleClick({ x: args.x, y: args.y });
          } else {
            response = await doubleClick();
          }
          break;

        case "get_active_window":
          response = await getActiveWindow();
          break;

        case "list_windows":
          response = await listAllWindows();
          break;

        case "focus_window":
          if (typeof args?.title !== 'string') {
            throw new Error("Invalid window title argument");
          }
          response = await focusWindow(args.title);
          break;

        case "resize_window":
          if (typeof args?.title !== 'string' || 
              typeof args?.width !== 'number' || 
              typeof args?.height !== 'number') {
            throw new Error("Invalid window resize arguments");
          }
          response = await resizeWindow(args.title, args.width, args.height);
          break;

        case "reposition_window":
          if (typeof args?.title !== 'string' || 
              typeof args?.x !== 'number' || 
              typeof args?.y !== 'number') {
            throw new Error("Invalid window reposition arguments");
          }
          response = await repositionWindow(args.title, args.x, args.y);
          break;

        case "minimize_window":
          if (typeof args?.title !== 'string') {
            throw new Error("Invalid window title argument");
          }
          response = await minimizeWindow(args.title);
          break;

        case "restore_window":
          if (typeof args?.title !== 'string') {
            throw new Error("Invalid window title argument");
          }
          response = await restoreWindow(args.title);
          break;

        case "get_clipboard_content":
          response = await getClipboardContent();
          break;

        case "set_clipboard_content":
          if (!isClipboardInput(args)) {
            throw new Error("Invalid clipboard input arguments");
          }
          response = await setClipboardContent(args);
          break;

        case "has_clipboard_text":
          response = await hasClipboardText();
          break;

        case "clear_clipboard":
          response = await clearClipboard();
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // For non-image responses, return as text
      return {
        content: [{
          type: "text",
          text: JSON.stringify(response, null, 2)
        }]
      };

    } catch (error) {
      const errorContent: TextContent = {
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      };

      return {
        content: [errorContent],
        isError: true
      };
    }
  });
}

function isMousePosition(args: unknown): args is MousePosition {
  if (typeof args !== 'object' || args === null) return false;
  const pos = args as Record<string, unknown>;
  return typeof pos.x === 'number' && typeof pos.y === 'number';
}

function isKeyboardInput(args: unknown): args is KeyboardInput {
  if (typeof args !== 'object' || args === null) return false;
  const input = args as Record<string, unknown>;
  return typeof input.text === 'string';
}

function isKeyCombination(args: unknown): args is KeyCombination {
  if (typeof args !== 'object' || args === null) return false;
  const combo = args as Record<string, unknown>;
  if (!Array.isArray(combo.keys)) return false;
  return combo.keys.every(key => typeof key === 'string');
}

function isClipboardInput(args: unknown): args is ClipboardInput {
  if (typeof args !== 'object' || args === null) return false;
  const input = args as Record<string, unknown>;
  return typeof input.text === 'string';
}
