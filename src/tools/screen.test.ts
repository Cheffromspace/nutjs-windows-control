import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the provider
vi.mock('../providers/factory.js', () => ({
  createAutomationProvider: () => ({
    screen: {
      getScreenSize: vi.fn().mockReturnValue({
        success: true,
        message: "Screen size retrieved successfully",
        data: {
          width: 1920,
          height: 1080
        }
      }),
      getAllDisplays: vi.fn().mockReturnValue({
        success: true,
        message: "Screen size retrieved successfully",
        data: {
          width: 1920,
          height: 1080
        }
      }),
      getActiveWindow: vi.fn().mockReturnValue({
        success: true,
        message: "Active window information retrieved successfully",
        data: {
          title: 'Test Window',
          position: { x: 10, y: 20 },
          size: { width: 800, height: 600 }
        }
      }),
      focusWindow: vi.fn().mockImplementation((title) => {
        if (title === 'Target') {
          return {
            success: true,
            message: "Successfully focused window: Target"
          };
        } else if (title === 'Nonexistent') {
          return {
            success: false,
            message: "Could not find window with title: Nonexistent"
          };
        } else {
          return {
            success: false,
            message: "Failed to focus window: Cannot list windows"
          };
        }
      }),
      resizeWindow: vi.fn().mockImplementation((title, width, height) => {
        if (title === 'Target') {
          return {
            success: true,
            message: `Successfully resized window: Target to ${width}x${height}`
          };
        } else if (title === 'Nonexistent') {
          return {
            success: false,
            message: "Could not find window with title: Nonexistent"
          };
        } else {
          return {
            success: false,
            message: "Failed to resize window: Cannot list windows"
          };
        }
      }),
      repositionWindow: vi.fn().mockImplementation((title, x, y) => {
        if (title === 'Target') {
          return {
            success: true,
            message: `Successfully repositioned window: Target to (${x},${y})`
          };
        } else if (title === 'Nonexistent') {
          return {
            success: false,
            message: "Could not find window with title: Nonexistent"
          };
        } else {
          return {
            success: false,
            message: "Failed to reposition window: Cannot list windows"
          };
        }
      })
    }
  })
}));
import { 
  getScreenSize, 
  getActiveWindow, 
  focusWindow,
  resizeWindow,
  repositionWindow
} from './screen.js';

describe('Screen Functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('getScreenSize', () => {
    it('should return screen dimensions on success', () => {
      // Execute
      const result = getScreenSize();

      // Verify
      expect(result).toEqual({
        success: true,
        message: "Screen size retrieved successfully",
        data: {
          width: 1920,
          height: 1080
        }
      });
    });
  });

  describe('getActiveWindow', () => {
    it('should return active window information on success', () => {
      // Execute
      const result = getActiveWindow();

      // Verify
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
  });

  describe('focusWindow', () => {
    it('should focus window with matching title', () => {
      // Execute
      const result = focusWindow('Target');

      // Verify
      expect(result).toEqual({
        success: true,
        message: "Successfully focused window: Target"
      });
    });

    it('should return error when window with title is not found', () => {
      // Execute
      const result = focusWindow('Nonexistent');

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Could not find window with title: Nonexistent"
      });
    });

    it('should return error response when focus operation fails', () => {
      // Execute
      const result = focusWindow('Any');

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to focus window: Cannot list windows"
      });
    });
  });

  describe('resizeWindow', () => {
    it('should resize window with matching title', () => {
      // Execute
      const result = resizeWindow('Target', 1024, 768);

      // Verify
      expect(result).toEqual({
        success: true,
        message: "Successfully resized window: Target to 1024x768"
      });
    });

    it('should return error when window with title is not found', () => {
      // Execute
      const result = resizeWindow('Nonexistent', 1024, 768);

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Could not find window with title: Nonexistent"
      });
    });

    it('should return error response when resize operation fails', () => {
      // Execute
      const result = resizeWindow('Any', 1024, 768);

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to resize window: Cannot list windows"
      });
    });
  });

  describe('repositionWindow', () => {
    it('should reposition window with matching title', () => {
      // Execute
      const result = repositionWindow('Target', 100, 200);

      // Verify
      expect(result).toEqual({
        success: true,
        message: "Successfully repositioned window: Target to (100,200)"
      });
    });

    it('should return error when window with title is not found', () => {
      // Execute
      const result = repositionWindow('Nonexistent', 100, 200);

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Could not find window with title: Nonexistent"
      });
    });

    it('should return error response when reposition operation fails', () => {
      // Execute
      const result = repositionWindow('Any', 100, 200);

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to reposition window: Cannot list windows"
      });
    });
  });
});
