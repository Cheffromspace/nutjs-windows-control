import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupTools } from './tools.js';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Mock all tool modules
vi.mock('../tools/mouse.js', () => ({
  moveMouse: vi.fn(() => ({ success: true, message: 'Mouse moved' })),
  clickMouse: vi.fn(),
  doubleClick: vi.fn(),
  getCursorPosition: vi.fn(),
  scrollMouse: vi.fn(),
  dragMouse: vi.fn(),
  clickAt: vi.fn()
}));

vi.mock('../tools/keyboard.js', () => ({
  typeText: vi.fn(() => ({ success: true, message: 'Text typed' })),
  pressKey: vi.fn(() => ({ success: true, message: 'Key pressed' })),
  pressKeyCombination: vi.fn().mockResolvedValue({
    success: true,
    message: 'Pressed key combination: control+c'
  }),
  holdKey: vi.fn()
}));

vi.mock('../tools/screen.js', () => ({
  getScreenSize: vi.fn(),
  getActiveWindow: vi.fn(),
  focusWindow: vi.fn(),
  resizeWindow: vi.fn(),
  repositionWindow: vi.fn(),
  minimizeWindow: vi.fn(),
  restoreWindow: vi.fn()
}));

// Mock the automation provider factory
vi.mock('../providers/factory.js', () => {
  // Create mock provider with all required automation interfaces
  const mockKeyboardAutomation = {
    typeText: vi.fn(() => ({ success: true, message: 'Text typed' })),
    pressKey: vi.fn(() => ({ success: true, message: 'Key pressed' })),
    pressKeyCombination: vi.fn().mockResolvedValue({
      success: true,
      message: 'Pressed key combination: control+c'
    }),
    holdKey: vi.fn()
  };
  
  const mockMouseAutomation = {
    moveMouse: vi.fn(() => ({ success: true, message: 'Mouse moved' })),
    clickMouse: vi.fn(),
    doubleClick: vi.fn(),
    getCursorPosition: vi.fn(),
    scrollMouse: vi.fn(),
    dragMouse: vi.fn(),
    clickAt: vi.fn()
  };
  
  const mockScreenAutomation = {
    getScreenSize: vi.fn(),
    getActiveWindow: vi.fn(),
    focusWindow: vi.fn(),
    resizeWindow: vi.fn(),
    repositionWindow: vi.fn(),
    getScreenshot: vi.fn()
  };
  
  const mockClipboardAutomation = {
    getClipboardContent: vi.fn(),
    setClipboardContent: vi.fn(),
    hasClipboardText: vi.fn(),
    clearClipboard: vi.fn()
  };
  
  return {
    createAutomationProvider: vi.fn(() => ({
      keyboard: mockKeyboardAutomation,
      mouse: mockMouseAutomation,
      screen: mockScreenAutomation,
      clipboard: mockClipboardAutomation
    }))
  };
});

// Import for mocking
import { createAutomationProvider } from '../providers/factory.js';

describe('Tools Handler', () => {
  let mockServer: Server;
  let listToolsHandler: (request?: any) => Promise<any>;
  let callToolHandler: (request: any) => Promise<any>;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock server with handler setters
    mockServer = {
      setRequestHandler: vi.fn((schema, handler) => {
        if (schema === ListToolsRequestSchema) {
          listToolsHandler = handler;
        } else if (schema === CallToolRequestSchema) {
          callToolHandler = handler;
        }
      })
    } as unknown as Server;

    // Setup tools with mock server and mock provider
    const mockProvider = vi.mocked(createAutomationProvider)();
    setupTools(mockServer, mockProvider);
  });

  describe('Tool Registration', () => {
    it('should register both request handlers', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(ListToolsRequestSchema, expect.any(Function));
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(CallToolRequestSchema, expect.any(Function));
    });

    it('should return list of available tools', async () => {
      const result = await listToolsHandler();
      expect(result.tools).toBeInstanceOf(Array);
      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.tools[0]).toHaveProperty('name');
      expect(result.tools[0]).toHaveProperty('description');
      expect(result.tools[0]).toHaveProperty('inputSchema');
    });
  });

  describe('Tool Execution', () => {

    it('should execute move_mouse tool with valid arguments', async () => {
      // Mock is already setup in the mock declaration with default success response
      const mockProvider = vi.mocked(createAutomationProvider)();

      const result = await callToolHandler({
        params: {
          name: 'move_mouse',
          arguments: { x: 100, y: 200 }
        }
      });

      expect(mockProvider.mouse.moveMouse).toHaveBeenCalledWith({ x: 100, y: 200 });
      expect(JSON.parse(result.content[0].text)).toEqual({
        success: true,
        message: 'Mouse moved'
      });
    });

    it('should execute type_text tool with valid arguments', async () => {
      // Mock is already setup in the mock declaration with default success response
      const mockProvider = vi.mocked(createAutomationProvider)();

      const result = await callToolHandler({
        params: {
          name: 'type_text',
          arguments: { text: 'Hello World' }
        }
      });

      expect(mockProvider.keyboard.typeText).toHaveBeenCalledWith({ text: 'Hello World' });
      expect(JSON.parse(result.content[0].text)).toEqual({
        success: true,
        message: 'Text typed'
      });
    });

    it('should execute click_mouse tool with default button', async () => {
      const mockProvider = vi.mocked(createAutomationProvider)();
      vi.mocked(mockProvider.mouse.clickMouse).mockReturnValueOnce({ success: true, message: 'Mouse clicked' });

      const result = await callToolHandler({
        params: {
          name: 'click_mouse',
          arguments: {}
        }
      });

      expect(mockProvider.mouse.clickMouse).toHaveBeenCalledWith('left');
      expect(JSON.parse(result.content[0].text)).toEqual({
        success: true,
        message: 'Mouse clicked'
      });
    });

    it('should execute click_mouse tool with specified button', async () => {
      const mockProvider = vi.mocked(createAutomationProvider)();
      vi.mocked(mockProvider.mouse.clickMouse).mockReturnValueOnce({ success: true, message: 'Right mouse clicked' });

      const result = await callToolHandler({
        params: {
          name: 'click_mouse',
          arguments: { button: 'right' }
        }
      });

      expect(mockProvider.mouse.clickMouse).toHaveBeenCalledWith('right');
      expect(JSON.parse(result.content[0].text)).toEqual({
        success: true,
        message: 'Right mouse clicked'
      });
    });

    it('should execute press_key tool with valid arguments', async () => {
      const mockProvider = vi.mocked(createAutomationProvider)();
      
      const result = await callToolHandler({
        params: {
          name: 'press_key',
          arguments: { key: 'enter' }
        }
      });

      expect(mockProvider.keyboard.pressKey).toHaveBeenCalledWith('enter');
      expect(JSON.parse(result.content[0].text)).toEqual({
        success: true,
        message: 'Key pressed'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool name', async () => {
      const result = await callToolHandler({
        params: {
          name: 'invalid_tool',
          arguments: {}
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });

    it('should handle invalid arguments', async () => {
      const result = await callToolHandler({
        params: {
          name: 'move_mouse',
          arguments: { invalid: 'args' }
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid mouse position arguments');
    });

    it('should handle tool execution errors', async () => {
      const mockProvider = vi.mocked(createAutomationProvider)();
      vi.mocked(mockProvider.keyboard.pressKey).mockImplementationOnce(() => {
        throw new Error('Key press failed');
      });

      const result = await callToolHandler({
        params: {
          name: 'press_key',
          arguments: { key: 'enter' }
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Key press failed');
    });
  });

  describe('Type Validation', () => {
    it('should validate mouse position arguments', async () => {
      // Mock is already set up in the mock declaration

      const validResult = await callToolHandler({
        params: {
          name: 'move_mouse',
          arguments: { x: 100, y: 200 }
        }
      });
      expect(JSON.parse(validResult.content[0].text)).toHaveProperty('success');

      const invalidResult = await callToolHandler({
        params: {
          name: 'move_mouse',
          arguments: { x: 'invalid', y: 200 }
        }
      });
      expect(invalidResult.isError).toBe(true);
    });

    it('should validate keyboard input arguments', async () => {
      // Mock is already set up in the mock declaration

      const validResult = await callToolHandler({
        params: {
          name: 'type_text',
          arguments: { text: 'Hello' }
        }
      });
      expect(JSON.parse(validResult.content[0].text)).toHaveProperty('success');

      const invalidResult = await callToolHandler({
        params: {
          name: 'type_text',
          arguments: { text: 123 }
        }
      });
      expect(invalidResult.isError).toBe(true);
    });

    it('should validate key combination arguments', async () => {
      const validResult = await callToolHandler({
        params: {
          name: 'press_key_combination',
          arguments: { keys: ['control', 'c'] }
        }
      });
      expect(JSON.parse(validResult.content[0].text)).toEqual({
        success: true,
        message: 'Pressed key combination: control+c'
      });

      const invalidResult = await callToolHandler({
        params: {
          name: 'press_key_combination',
          arguments: { keys: 'invalid' }
        }
      });
      expect(invalidResult.isError).toBe(true);
    });
  });
});
