import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  TextContent
} from "@modelcontextprotocol/sdk/types.js";
import { MousePosition, KeyboardInput, KeyCombination, ClipboardInput, KeyHoldOperation, ScreenshotOptions } from "../types/common.js";
import { WindowsControlResponse } from "../types/responses.js";
// All tool functions now come from the provider
// Provider is now passed from the main server instance
import { AutomationProvider } from "../interfaces/provider.js";

/**
 * Validates the mouse button parameter and returns a valid button value
 * @param button The button parameter to validate
 * @returns A validated mouse button value: 'left', 'right', or 'middle'
 */
function validateButton(button?: unknown): 'left' | 'right' | 'middle' {
  return (typeof button === 'string' && 
    ['left', 'right', 'middle'].includes(button)) ? 
    button as 'left' | 'right' | 'middle' : 'left';
}

/**
 * Set up automation tools on the MCP server using the provided automation provider.
 * This function implements the provider pattern for all tool handlers, allowing
 * for dependency injection of automation implementations.
 * 
 * The provider pattern offers several benefits:
 * - Testability: Makes unit testing easier by allowing mock providers
 * - Flexibility: Allows changing provider implementations without changing tool handlers
 * - Consistency: Ensures all automation is handled through a single provider interface
 * - Maintainability: Reduces direct dependencies on specific implementation details
 * 
 * @param server The Model Context Protocol server instance
 * @param provider The automation provider implementation that will handle system interactions
 */
export function setupTools(server: Server, provider: AutomationProvider): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [
      {
        name: "get_screenshot",
        description: "Take a screenshot optimized for AI readability, especially for text-heavy content. Uses default settings: JPEG format, 85% quality, grayscale enabled, and 1280px width (preserving aspect ratio). Supports region capture, format options, quality adjustment, and custom resize settings.",
        inputSchema: {
          type: "object",
          properties: {
            region: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate of the region" },
                y: { type: "number", description: "Y coordinate of the region" },
                width: { type: "number", description: "Width of the region" },
                height: { type: "number", description: "Height of the region" }
              },
              required: ["x", "y", "width", "height"],
              description: "Specific region to capture (optional)"
            },
            format: {
              type: "string",
              enum: ["png", "jpeg"],
              default: "jpeg",
              description: "Output format of the screenshot"
            },
            quality: {
              type: "number",
              minimum: 1,
              maximum: 100,
              default: 85,
              description: "JPEG quality (1-100, higher = better quality), only used for JPEG format"
            },
            grayscale: {
              type: "boolean",
              default: true,
              description: "Convert to grayscale"
            },
            compressionLevel: {
              type: "number",
              minimum: 0,
              maximum: 9,
              default: 6,
              description: "PNG compression level (0-9, higher = better compression), only used for PNG format"
            },
            resize: {
              type: "object",
              properties: {
                width: { 
                  type: "number", 
                  default: 1280,
                  description: "Target width" 
                },
                height: { type: "number", description: "Target height" },
                fit: { 
                  type: "string", 
                  enum: ["contain", "cover", "fill", "inside", "outside"],
                  default: "contain",
                  description: "Resize fit option"
                }
              },
              default: { width: 1280, fit: "contain" },
              description: "Resize options for the screenshot"
            }
          }
        }
      },
      {
        name: "click_at",
        description: "Move mouse to coordinates, click, then return to original position",
        inputSchema: {
          type: "object",
          properties: {
            x: { type: "number", description: "X coordinate" },
            y: { type: "number", description: "Y coordinate" },
            button: { 
              type: "string", 
              enum: ["left", "right", "middle"],
              default: "left",
              description: "Mouse button to click" 
            }
          },
          required: ["x", "y"]
        }
      },
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
        name: "hold_key",
        description: "Hold or release a keyboard key with optional duration",
        inputSchema: {
          type: "object",
          properties: {
            key: { 
              type: "string",
              description: "Key to hold/release (e.g., 'shift', 'control')" 
            },
            duration: { 
              type: "number",
              description: "Duration to hold the key in milliseconds (only for 'down' state)"
            },
            state: {
              type: "string",
              enum: ["down", "up"],
              description: "Whether to press down or release the key"
            }
          },
          required: ["key", "state"]
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
      
      // Use the provider passed from the server instance

      switch (name) {
        case "get_screenshot": {
          // Validate and convert screenshot options with AI-optimized defaults
          const screenshotOptions: ScreenshotOptions = {
            // Default values for text-heavy content readability
            format: 'jpeg',
            quality: 85,
            grayscale: true,
            resize: {
              width: 1280,
              fit: 'contain'
            }
          };
          
          if (args?.region && 
              typeof args.region === 'object' && 
              'x' in args.region && typeof args.region.x === 'number' && 
              'y' in args.region && typeof args.region.y === 'number' &&
              'width' in args.region && typeof args.region.width === 'number' &&
              'height' in args.region && typeof args.region.height === 'number') {
            screenshotOptions.region = {
              x: args.region.x,
              y: args.region.y,
              width: args.region.width,
              height: args.region.height
            };
          }
          
          if (args?.format === 'jpeg' || args?.format === 'png') {
            screenshotOptions.format = args.format;
          }
          
          if (typeof args?.quality === 'number') {
            screenshotOptions.quality = args.quality;
          }
          
          if (typeof args?.grayscale === 'boolean') {
            screenshotOptions.grayscale = args.grayscale;
          }
          
          if (typeof args?.compressionLevel === 'number') {
            screenshotOptions.compressionLevel = args.compressionLevel;
          }
          
          if (args?.resize && typeof args.resize === 'object') {
            // Preserve the default resize settings that weren't explicitly overridden
            if (!screenshotOptions.resize) {
              screenshotOptions.resize = { width: 1280, fit: 'contain' };
            }
            
            if ('width' in args.resize && typeof args.resize.width === 'number') {
              screenshotOptions.resize.width = args.resize.width;
            }
            
            if ('height' in args.resize && typeof args.resize.height === 'number') {
              screenshotOptions.resize.height = args.resize.height;
            }
            
            if ('fit' in args.resize && typeof args.resize.fit === 'string') {
              // Type-safe check for valid fit values
              const fitValue = args.resize.fit;
              if (fitValue === 'contain' || fitValue === 'cover' || 
                  fitValue === 'fill' || fitValue === 'inside' || fitValue === 'outside') {
                screenshotOptions.resize.fit = fitValue;
              }
            }
          }
          
          response = await provider.screen.getScreenshot(screenshotOptions);
          break;
        }
          
        case "click_at":
          if (typeof args?.x !== 'number' || typeof args?.y !== 'number') {
            throw new Error("Invalid click_at arguments");
          }
          response = provider.mouse.clickAt(
            args.x,
            args.y,
            validateButton(args?.button)
          );
          break;

        case "move_mouse":
          if (!isMousePosition(args)) {
            throw new Error("Invalid mouse position arguments");
          }
          response = provider.mouse.moveMouse(args);
          break;

        case "click_mouse":
          response = provider.mouse.clickMouse(
            validateButton(args?.button)
          );
          break;

        case "drag_mouse":
          if (typeof args?.fromX !== 'number' || 
              typeof args?.fromY !== 'number' ||
              typeof args?.toX !== 'number' ||
              typeof args?.toY !== 'number') {
            throw new Error("Invalid drag mouse arguments");
          }
          response = provider.mouse.dragMouse(
            { x: args.fromX, y: args.fromY },
            { x: args.toX, y: args.toY },
            validateButton(args?.button)
          );
          break;


        case "scroll_mouse":
          if (typeof args?.amount !== 'number') {
            throw new Error("Invalid scroll amount argument");
          }
          response = provider.mouse.scrollMouse(args.amount);
          break;

        case "type_text":
          if (!isKeyboardInput(args)) {
            throw new Error("Invalid keyboard input arguments");
          }
          response = provider.keyboard.typeText(args);
          break;

        case "press_key":
          if (typeof args?.key !== 'string') {
            throw new Error("Invalid key press arguments");
          }
          response = provider.keyboard.pressKey(args.key);
          break;

        case "hold_key":
          if (!isKeyHoldOperation(args)) {
            throw new Error("Invalid key hold arguments");
          }
          response = await provider.keyboard.holdKey(args);
          break;

        case "press_key_combination":
          if (!isKeyCombination(args)) {
            throw new Error("Invalid key combination arguments");
          }
          response = await provider.keyboard.pressKeyCombination(args);
          break;

        case "get_screen_size":
          response = provider.screen.getScreenSize();
          break;

        case "get_cursor_position":
          response = provider.mouse.getCursorPosition();
          break;

        case "double_click":
          if (args && typeof args.x === 'number' && typeof args.y === 'number') {
            response = provider.mouse.doubleClick({ x: args.x, y: args.y });
          } else {
            response = provider.mouse.doubleClick();
          }
          break;

        case "get_active_window":
          response = provider.screen.getActiveWindow();
          break;

        case "focus_window":
          if (typeof args?.title !== 'string') {
            throw new Error("Invalid window title argument");
          }
          response = provider.screen.focusWindow(args.title);
          break;

        case "resize_window":
          if (typeof args?.title !== 'string' || 
              typeof args?.width !== 'number' || 
              typeof args?.height !== 'number') {
            throw new Error("Invalid window resize arguments");
          }
          response = provider.screen.resizeWindow(args.title, args.width, args.height);
          break;

        case "reposition_window":
          if (typeof args?.title !== 'string' || 
              typeof args?.x !== 'number' || 
              typeof args?.y !== 'number') {
            throw new Error("Invalid window reposition arguments");
          }
          response = provider.screen.repositionWindow(args.title, args.x, args.y);
          break;
          
        case "minimize_window":
          if (typeof args?.title !== 'string') {
            throw new Error("Invalid window title argument");
          }
          response = { success: false, message: "Minimize window operation is not supported" };
          break;

        case "restore_window":
          if (typeof args?.title !== 'string') {
            throw new Error("Invalid window title argument");
          }
          response = { success: false, message: "Restore window operation is not supported" };
          break;

        case "get_clipboard_content":
          response = await provider.clipboard.getClipboardContent();
          break;

        case "set_clipboard_content":
          if (!isClipboardInput(args)) {
            throw new Error("Invalid clipboard input arguments");
          }
          response = await provider.clipboard.setClipboardContent(args);
          break;

        case "has_clipboard_text":
          response = await provider.clipboard.hasClipboardText();
          break;

        case "clear_clipboard":
          response = await provider.clipboard.clearClipboard();
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // Handle special case for screenshot which returns content with image data
      const typedResponse = response as WindowsControlResponse;
      
      
      // Check for standard MCP format (content property with image)
      if ('content' in typedResponse && 
          typedResponse.content && 
          Array.isArray(typedResponse.content) && 
          typedResponse.content.length > 0 && 
          typedResponse.content[0] && 
          typeof typedResponse.content[0] === 'object' &&
          'type' in typedResponse.content[0] && 
          typedResponse.content[0].type === "image") {
        return {
          content: typedResponse.content
        };
      }
      
      // For all other responses, return as text
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

/**
 * Type guard to validate if an object matches the MousePosition interface
 * @param args The object to validate
 * @returns True if the object is a valid MousePosition
 */
function isMousePosition(args: unknown): args is MousePosition {
  if (typeof args !== 'object' || args === null) return false;
  const pos = args as Record<string, unknown>;
  return typeof pos.x === 'number' && typeof pos.y === 'number';
}

/**
 * Type guard to validate if an object matches the KeyboardInput interface
 * @param args The object to validate
 * @returns True if the object is a valid KeyboardInput
 */
function isKeyboardInput(args: unknown): args is KeyboardInput {
  if (typeof args !== 'object' || args === null) return false;
  const input = args as Record<string, unknown>;
  return typeof input.text === 'string';
}

/**
 * Type guard to validate if an object matches the KeyCombination interface
 * @param args The object to validate
 * @returns True if the object is a valid KeyCombination
 */
function isKeyCombination(args: unknown): args is KeyCombination {
  if (typeof args !== 'object' || args === null) return false;
  const combo = args as Record<string, unknown>;
  if (!Array.isArray(combo.keys)) return false;
  return combo.keys.every(key => typeof key === 'string');
}

/**
 * Type guard to validate if an object matches the KeyHoldOperation interface
 * @param args The object to validate
 * @returns True if the object is a valid KeyHoldOperation
 */
function isKeyHoldOperation(args: unknown): args is KeyHoldOperation {
  if (typeof args !== 'object' || args === null) return false;
  const op = args as Record<string, unknown>;
  return (
    typeof op.key === 'string' &&
    (op.state === 'down' || op.state === 'up') &&
    (op.duration === undefined || typeof op.duration === 'number')
  );
}

/**
 * Type guard to validate if an object matches the ClipboardInput interface
 * @param args The object to validate
 * @returns True if the object is a valid ClipboardInput
 */
function isClipboardInput(args: unknown): args is ClipboardInput {
  if (typeof args !== 'object' || args === null) return false;
  const input = args as Record<string, unknown>;
  return typeof input.text === 'string';
}
