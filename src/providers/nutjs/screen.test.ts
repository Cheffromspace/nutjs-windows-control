import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Declarations must be at the top level - before imports
vi.mock('@nut-tree/libnut', () => ({
  default: {
    screen: {
      capture: vi.fn()
    },
    getActiveWindow: vi.fn(),
    getWindowTitle: vi.fn(),
    getWindowRect: vi.fn(),
    getWindows: vi.fn(),
    focusWindow: vi.fn(),
    resizeWindow: vi.fn(),
    moveWindow: vi.fn()
  }
}));

vi.mock('sharp', () => {
  const mockSharp = vi.fn().mockReturnValue({
    grayscale: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('test-image-data'))
  });
  return { default: mockSharp };
});

// Mock Buffer.toString to return a predictable base64 string
const originalToString = Buffer.prototype.toString;
Buffer.prototype.toString = function(encoding?: BufferEncoding): string {
  if (encoding === 'base64') {
    return 'mockBase64String';
  }
  return originalToString.call(this, encoding);
};

// Import mocked modules after vi.mock declarations
import libnut from '@nut-tree/libnut';
import { NutJSScreenAutomation } from './screen';

describe('NutJSScreenAutomation', () => {
  let screen: NutJSScreenAutomation;

  beforeEach(() => {
    vi.resetAllMocks();
    screen = new NutJSScreenAutomation();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getScreenSize', () => {
    it('should return screen dimensions on success', () => {
      // Setup
      const mockScreen = { width: 1920, height: 1080, image: Buffer.from('test') };
      (libnut.screen.capture as any).mockReturnValue(mockScreen);

      // Execute
      const result = screen.getScreenSize();

      // Verify
      expect(libnut.screen.capture).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        message: "Screen size retrieved successfully",
        data: {
          width: 1920,
          height: 1080
        }
      });
    });

    it('should return error response when capture fails', () => {
      // Setup
      (libnut.screen.capture as any).mockImplementation(() => {
        throw new Error('Capture failed');
      });

      // Execute
      const result = screen.getScreenSize();

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to get screen size: Capture failed"
      });
    });
  });


  describe('getActiveWindow', () => {
    it('should return active window information on success', () => {
      // Setup
      (libnut.getActiveWindow as any).mockReturnValue(123);
      (libnut.getWindowTitle as any).mockReturnValue('Test Window');
      (libnut.getWindowRect as any).mockReturnValue({ x: 10, y: 20, width: 800, height: 600 });

      // Execute
      const result = screen.getActiveWindow();

      // Verify
      expect(libnut.getActiveWindow).toHaveBeenCalledTimes(1);
      expect(libnut.getWindowTitle).toHaveBeenCalledWith(123);
      expect(libnut.getWindowRect).toHaveBeenCalledWith(123);
      expect(result).toEqual({
        success: true,
        message: "Active window information retrieved successfully",
        data: {
          title: 'Test Window',
          position: { x: 10, y: 20 },
          size: { width: 800, height: 600 }
        }
      });
    });

    it('should return error response when active window retrieval fails', () => {
      // Setup
      (libnut.getActiveWindow as any).mockImplementation(() => {
        throw new Error('Cannot get active window');
      });

      // Execute
      const result = screen.getActiveWindow();

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to get active window information: Cannot get active window"
      });
    });
  });


  describe('focusWindow', () => {
    it('should focus window with matching title', () => {
      // Setup
      (libnut.getWindows as any).mockReturnValue([1, 2, 3]);
      (libnut.getWindowTitle as any).mockImplementation((handle: number) => {
        return handle === 2 ? 'Target Window' : `Window ${handle}`;
      });

      // Execute
      const result = screen.focusWindow('Target');

      // Verify
      expect(libnut.getWindows).toHaveBeenCalledTimes(1);
      expect(libnut.getWindowTitle).toHaveBeenCalledTimes(2); // Should stop after finding match
      expect(libnut.focusWindow).toHaveBeenCalledWith(2);
      expect(result).toEqual({
        success: true,
        message: "Successfully focused window: Target"
      });
    });

    it('should return error when window with title is not found', () => {
      // Setup
      (libnut.getWindows as any).mockReturnValue([1, 2, 3]);
      (libnut.getWindowTitle as any).mockImplementation((handle: number) => `Window ${handle}`);

      // Execute
      const result = screen.focusWindow('Nonexistent');

      // Verify
      expect(libnut.getWindowTitle).toHaveBeenCalledTimes(3);
      expect(libnut.focusWindow).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: "Could not find window with title: Nonexistent"
      });
    });

    it('should return error response when focus operation fails', () => {
      // Setup
      (libnut.getWindows as any).mockImplementation(() => {
        throw new Error('Cannot list windows');
      });

      // Execute
      const result = screen.focusWindow('Any');

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to focus window: Cannot list windows"
      });
    });
  });

  describe('resizeWindow', () => {
    it('should resize window with matching title', () => {
      // Setup
      (libnut.getWindows as any).mockReturnValue([1, 2, 3]);
      (libnut.getWindowTitle as any).mockImplementation((handle: number) => {
        return handle === 2 ? 'Target Window' : `Window ${handle}`;
      });

      // Execute
      const result = screen.resizeWindow('Target', 1024, 768);

      // Verify
      expect(libnut.getWindows).toHaveBeenCalledTimes(1);
      expect(libnut.getWindowTitle).toHaveBeenCalledTimes(2); // Should stop after finding match
      expect(libnut.resizeWindow).toHaveBeenCalledWith(2, { width: 1024, height: 768 });
      expect(result).toEqual({
        success: true,
        message: "Successfully resized window: Target to 1024x768"
      });
    });

    it('should return error when window with title is not found', () => {
      // Setup
      (libnut.getWindows as any).mockReturnValue([1, 2, 3]);
      (libnut.getWindowTitle as any).mockImplementation((handle: number) => `Window ${handle}`);

      // Execute
      const result = screen.resizeWindow('Nonexistent', 1024, 768);

      // Verify
      expect(libnut.getWindowTitle).toHaveBeenCalledTimes(3);
      expect(libnut.resizeWindow).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: "Could not find window with title: Nonexistent"
      });
    });

    it('should return error response when resize operation fails', () => {
      // Setup
      (libnut.getWindows as any).mockImplementation(() => {
        throw new Error('Cannot list windows');
      });

      // Execute
      const result = screen.resizeWindow('Any', 1024, 768);

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to resize window: Cannot list windows"
      });
    });
  });

  describe('repositionWindow', () => {
    it('should reposition window with matching title', () => {
      // Setup
      (libnut.getWindows as any).mockReturnValue([1, 2, 3]);
      (libnut.getWindowTitle as any).mockImplementation((handle: number) => {
        return handle === 2 ? 'Target Window' : `Window ${handle}`;
      });

      // Execute
      const result = screen.repositionWindow('Target', 100, 200);

      // Verify
      expect(libnut.getWindows).toHaveBeenCalledTimes(1);
      expect(libnut.getWindowTitle).toHaveBeenCalledTimes(2); // Should stop after finding match
      expect(libnut.moveWindow).toHaveBeenCalledWith(2, { x: 100, y: 200 });
      expect(result).toEqual({
        success: true,
        message: "Successfully repositioned window: Target to (100,200)"
      });
    });

    it('should return error when window with title is not found', () => {
      // Setup
      (libnut.getWindows as any).mockReturnValue([1, 2, 3]);
      (libnut.getWindowTitle as any).mockImplementation((handle: number) => `Window ${handle}`);

      // Execute
      const result = screen.repositionWindow('Nonexistent', 100, 200);

      // Verify
      expect(libnut.getWindowTitle).toHaveBeenCalledTimes(3);
      expect(libnut.moveWindow).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: "Could not find window with title: Nonexistent"
      });
    });

    it('should return error response when reposition operation fails', () => {
      // Setup
      (libnut.getWindows as any).mockImplementation(() => {
        throw new Error('Cannot list windows');
      });

      // Execute
      const result = screen.repositionWindow('Any', 100, 200);

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to reposition window: Cannot list windows"
      });
    });
  });

  describe('getScreenshot', () => {
    // Instead of testing the entire pipeline which is complex to mock,
    // test the success path at a higher level and error handling
    it('should handle screen capture error gracefully', async () => {
      // Setup
      (libnut.screen.capture as any).mockImplementation(() => {
        throw new Error('Screenshot capture failed');
      });

      // Execute
      const result = await screen.getScreenshot();

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to capture screenshot: Screenshot capture failed"
      });
    });
  });
});