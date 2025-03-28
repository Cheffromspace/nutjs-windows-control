import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'; // Added Mock type
import { KeysenderScreenAutomation } from './screen.js';
import koffi from 'koffi'; // Import koffi to mock it

// --- Mock koffi ---
// Define a mock function for GetSystemMetrics
const mockGetSystemMetrics: Mock = vi.fn();

vi.mock('koffi', () => {
  // Mock the 'func' method
  const mockFunc = vi.fn((name: string) => {
    if (name === 'int GetSystemMetrics(int nIndex)') {
      return mockGetSystemMetrics;
    }
    // Return a dummy function for any other func calls
    return vi.fn();
  });

  // Mock the 'load' method
  const mockLoad = vi.fn((libName: string) => {
    if (libName === 'user32.dll') {
      // Return an object that simulates the loaded library with the mocked 'func'
      return {
        func: mockFunc,
      };
    }
    // Return an empty object for other libraries
    return {};
  });

  return {
    // Mock the default export if koffi is imported as `import koffi from 'koffi'`
    default: {
      load: mockLoad,
    },
    // Also mock named exports if needed (though 'load' seems to be the main one used)
    load: mockLoad,
  };
});


// --- Mock keysender ---
vi.mock('keysender', async () => {
  // This empty import() is important to make Vitest properly track the module
  await vi.importActual('vitest'); // Keep this for keysender mock
  
  // Define mocks inline within this function to avoid hoisting problems
  const mockCapture = vi.fn().mockImplementation((part, _format) => {
    return part && typeof part === 'object'
      ? { data: Buffer.from('region-screenshot-data'), width: part.width, height: part.height }
      : { data: Buffer.from('full-screenshot-data'), width: 1920, height: 1080 };
  });
  
  const mockGet = vi.fn().mockReturnValue({
    title: 'Test Window',
    className: 'TestClass',
    handle: 12345
  });
  
  const mockGetView = vi.fn().mockReturnValue({
    x: 100,
    y: 200,
    width: 800,
    height: 600
  });
  
  const mockSet = vi.fn().mockReturnValue(true);
  const mockSetForeground = vi.fn();
  const mockSetView = vi.fn();
  
  // Create the mock object with all the required functions
  const mockObject = {
    Hardware: vi.fn().mockImplementation(() => ({
      workwindow: {
        capture: mockCapture,
        get: mockGet,
        set: mockSet,
        getView: mockGetView,
        setForeground: mockSetForeground,
        setView: mockSetView,
        isForeground: vi.fn().mockReturnValue(true),
        isOpen: vi.fn().mockReturnValue(true)
      }
    })),
    getScreenSize: vi.fn().mockReturnValue({
      width: 1920,
      height: 1080
    }),
    getAllWindows: vi.fn().mockReturnValue([
      { title: 'Test Window', className: 'TestClass', handle: 12345 }
    ]),
    getWindowChildren: vi.fn().mockReturnValue([])
  };
  
  // Return both default export and named exports
  return {
    default: mockObject, // Add default export to match 'import pkg from 'keysender''
    ...mockObject        // Spread the same object as named exports
  };
});

describe('KeysenderScreenAutomation', () => {
  let screenAutomation: KeysenderScreenAutomation;
  let keysender: any;
  let mockCapture: any;
  let mockGet: any;
  let mockGetView: any;
  let mockSet: any;
  let mockSetForeground: any;
  let mockSetView: any;
  // let mockGetScreenSize: any; // Removed unused variable
  let mockGetAllWindows: any;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Import the mocked module to get access to the mock functions
    // Using dynamic import to get the mocked module
    keysender = await import('keysender');
    
    // Get references to mocks from the hardware instance
    const hardware = keysender.Hardware();
    mockCapture = hardware.workwindow.capture;
    mockGet = hardware.workwindow.get;
    mockGetView = hardware.workwindow.getView;
    mockSet = hardware.workwindow.set;
    mockSetForeground = hardware.workwindow.setForeground;
    mockSetView = hardware.workwindow.setView;
    
    // Get references to other mocks
    // mockGetScreenSize = keysender.getScreenSize; // REMOVED - No longer used by getScreenSize
    mockGetAllWindows = keysender.getAllWindows;

    // Reset the koffi mock before each test
    mockGetSystemMetrics.mockClear();
    (koffi.load as Mock).mockClear();
    // Assuming mockFunc was captured if needed, clear it too.
    // If mockFunc is defined within the vi.mock scope, it resets automatically.

    // Create a new instance for each test
    screenAutomation = new KeysenderScreenAutomation();
  });

  describe('getScreenSize', () => {
    // Constants for system metrics indices used in screen.ts
    const SM_CXSCREEN = 0;
    const SM_CYSCREEN = 1;
    const SM_CMONITORS = 80;
    const SM_XVIRTUALSCREEN = 76;
    const SM_YVIRTUALSCREEN = 77;
    const SM_CXVIRTUALSCREEN = 78;
    const SM_CYVIRTUALSCREEN = 79;

    it('should return screen dimensions using koffi GetSystemMetrics for single monitor', () => {
      // Configure the mock GetSystemMetrics
      mockGetSystemMetrics.mockImplementation((nIndex: number) => {
        if (nIndex === SM_CXSCREEN) return 1920;
        if (nIndex === SM_CYSCREEN) return 1080;
        if (nIndex === SM_CMONITORS) return 1; // Single monitor
        if (nIndex === SM_XVIRTUALSCREEN) return 0;
        if (nIndex === SM_YVIRTUALSCREEN) return 0;
        if (nIndex === SM_CXVIRTUALSCREEN) return 1920;
        if (nIndex === SM_CYVIRTUALSCREEN) return 1080;
        return 0; // Default return for other indices
      });

      const result = screenAutomation.getScreenSize();

      // Check if GetSystemMetrics was called correctly
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_CXSCREEN);
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_CYSCREEN);
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_CMONITORS);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Primary screen size: 1920x1080');
      expect(result.data).toEqual({
        width: 1920,
        height: 1080,
        hasSecondScreen: false,
        monitorCount: 1
      });
    });

    it('should detect multiple monitors when present', () => {
      // Configure the mock GetSystemMetrics for dual monitors
      mockGetSystemMetrics.mockImplementation((nIndex: number) => {
        if (nIndex === SM_CXSCREEN) return 1920;
        if (nIndex === SM_CYSCREEN) return 1080;
        if (nIndex === SM_CMONITORS) return 2; // Dual monitors
        if (nIndex === SM_XVIRTUALSCREEN) return 0;
        if (nIndex === SM_YVIRTUALSCREEN) return 0;
        if (nIndex === SM_CXVIRTUALSCREEN) return 3840; // 1920 + 1920
        if (nIndex === SM_CYVIRTUALSCREEN) return 1080;
        return 0; // Default return for other indices
      });

      const result = screenAutomation.getScreenSize();

      // Check if GetSystemMetrics was called correctly
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_CMONITORS);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Primary screen size: 1920x1080, Second screen detected');
      expect(result.data).toEqual({
        width: 1920,
        height: 1080,
        hasSecondScreen: true,
        monitorCount: 2
      });
    });

    it('should handle errors when GetSystemMetrics returns zero', () => {
       // Configure the mock GetSystemMetrics to return 0 for width
      mockGetSystemMetrics.mockImplementation((nIndex: number) => {
        if (nIndex === SM_CXSCREEN) return 0; // Simulate error condition
        if (nIndex === SM_CYSCREEN) return 1080;
        return 0;
      });

      const result = screenAutomation.getScreenSize();

      expect(result.success).toBe(false);
      expect(result.message).toContain('GetSystemMetrics returned zero for screen dimensions');
    });

     it('should handle errors when GetSystemMetrics throws', () => {
      // Configure the mock GetSystemMetrics to throw
      const testError = new Error('Koffi API call failed');
      mockGetSystemMetrics.mockImplementation(() => {
        throw testError;
      });

      const result = screenAutomation.getScreenSize();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to get screen size using koffi: Koffi API call failed');
    });

    // Note: Testing the constructor failure (koffi.load failing) is more complex
    // as it happens during class instantiation. The current code handles it by
    // logging and using dummy functions. A separate test suite might be needed
    // to specifically test the constructor's error handling if required.
  });

  describe('getAllDisplays', () => {
    // Constants for system metrics indices used in screen.ts
    const SM_CXSCREEN = 0;
    const SM_CYSCREEN = 1;
    const SM_CMONITORS = 80;
    const SM_XVIRTUALSCREEN = 76;
    const SM_YVIRTUALSCREEN = 77;
    const SM_CXVIRTUALSCREEN = 78;
    const SM_CYVIRTUALSCREEN = 79;

    it('should return detailed information for a single monitor', () => {
      // Configure the mock GetSystemMetrics
      mockGetSystemMetrics.mockImplementation((nIndex: number) => {
        if (nIndex === SM_CXSCREEN) return 1920;
        if (nIndex === SM_CYSCREEN) return 1080;
        if (nIndex === SM_CMONITORS) return 1; // Single monitor
        if (nIndex === SM_XVIRTUALSCREEN) return 0;
        if (nIndex === SM_YVIRTUALSCREEN) return 0;
        if (nIndex === SM_CXVIRTUALSCREEN) return 1920;
        if (nIndex === SM_CYVIRTUALSCREEN) return 1080;
        return 0; // Default return for other indices
      });

      const result = screenAutomation.getAllDisplays();

      // Check if GetSystemMetrics was called correctly
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_CXSCREEN);
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_CYSCREEN);
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_CMONITORS);
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_XVIRTUALSCREEN);
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_YVIRTUALSCREEN);
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_CXVIRTUALSCREEN);
      expect(mockGetSystemMetrics).toHaveBeenCalledWith(SM_CYVIRTUALSCREEN);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('monitorCount', 1);
      expect(result.data).toHaveProperty('primaryDisplay');
      expect(result.data).toHaveProperty('monitors');
      
      // Check primary display properties
      const primaryDisplay = result.data?.primaryDisplay as Record<string, any>;
      expect(primaryDisplay).toHaveProperty('width', 1920);
      expect(primaryDisplay).toHaveProperty('height', 1080);
      expect(primaryDisplay).toHaveProperty('resolution', '1920x1080');
      expect(primaryDisplay).toHaveProperty('index', 0);
      expect(primaryDisplay).toHaveProperty('isPrimary', true);
      
      // Check monitors array
      const monitors = result.data?.monitors as Array<Record<string, any>>;
      expect(monitors).toHaveLength(1);
      expect(monitors[0]).toHaveProperty('index', 0);
      expect(monitors[0]).toHaveProperty('isPrimary', true);
      expect(monitors[0]).toHaveProperty('resolution', '1920x1080');
    });

    it('should return detailed information for multiple monitors', () => {
      // Configure the mock GetSystemMetrics for dual monitors
      mockGetSystemMetrics.mockImplementation((nIndex: number) => {
        if (nIndex === SM_CXSCREEN) return 1920;
        if (nIndex === SM_CYSCREEN) return 1080;
        if (nIndex === SM_CMONITORS) return 2; // Dual monitors
        if (nIndex === SM_XVIRTUALSCREEN) return 0;
        if (nIndex === SM_YVIRTUALSCREEN) return 0;
        if (nIndex === SM_CXVIRTUALSCREEN) return 3840; // 1920 + 1920
        if (nIndex === SM_CYVIRTUALSCREEN) return 1080;
        return 0; // Default return for other indices
      });

      const result = screenAutomation.getAllDisplays();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('monitorCount', 2);
      expect(result.data).toHaveProperty('primaryDisplay');
      expect(result.data).toHaveProperty('secondaryDisplays');
      expect(result.data).toHaveProperty('monitors');
      
      // Check primary display properties
      const primaryDisplay = result.data?.primaryDisplay as Record<string, any>;
      expect(primaryDisplay).toHaveProperty('width', 1920);
      expect(primaryDisplay).toHaveProperty('height', 1080);
      expect(primaryDisplay).toHaveProperty('resolution', '1920x1080');
      expect(primaryDisplay).toHaveProperty('index', 0);
      
      // Check secondary displays
      const secondaryDisplays = result.data?.secondaryDisplays as Array<Record<string, any>>;
      expect(secondaryDisplays).toHaveLength(1);
      expect(secondaryDisplays[0]).toHaveProperty('index', 1);
      expect(secondaryDisplays[0]).toHaveProperty('isPrimary', false);
      expect(secondaryDisplays[0]).toHaveProperty('resolution', '1920x1080');
      
      // Check monitors array
      const monitors = result.data?.monitors as Array<Record<string, any>>;
      expect(monitors).toHaveLength(2);
      expect(monitors[0]).toHaveProperty('index', 0);
      expect(monitors[0]).toHaveProperty('isPrimary', true);
      expect(monitors[1]).toHaveProperty('index', 1);
      expect(monitors[1]).toHaveProperty('isPrimary', false);
    });

    it('should handle errors when GetSystemMetrics returns zero for monitor count', () => {
      // Configure the mock GetSystemMetrics to return 0 for monitor count
      mockGetSystemMetrics.mockImplementation((nIndex: number) => {
        if (nIndex === SM_CMONITORS) return 0; // Simulate error condition
        return 1920; // Return valid values for other metrics
      });

      const result = screenAutomation.getAllDisplays();
      expect(result.success).toBe(false);
      expect(result.message).toContain('GetSystemMetrics reported 0 monitors');
    });
  });

  describe('getScreenshot', () => {
    it('should capture full screen when no region is specified', async () => {
      const result = await screenAutomation.getScreenshot();

      // Check that workwindow.capture was called with the right parameters
      expect(mockCapture).toHaveBeenCalledWith('rgba');
      
      expect(result.success).toBe(true);
      // Using 1280 as the standard width for HD Ready resolution
      // This is a common standard for digital imagery and display scaling
      expect(result.data).toEqual({
        width: 1280,
        height: 720
      });
      expect(result.screenshot).toBeDefined();
      expect(result.encoding).toBe('base64');
      expect(result.content?.[0].type).toBe('image');
    });

    it('should capture a specific region when region is specified', async () => {
      const region = { x: 100, y: 200, width: 300, height: 400 };
      const result = await screenAutomation.getScreenshot({ region });

      // Check that workwindow.capture was called with the right parameters
      expect(mockCapture).toHaveBeenCalledWith(region, 'rgba');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        width: 300,
        height: 400
      });
    });

    it('should handle errors gracefully', async () => {
      // Mock workwindow.capture to throw an error
      mockCapture.mockImplementationOnce(() => {
        throw new Error('Capture error');
      });

      const result = await screenAutomation.getScreenshot();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Capture error');
    });
  });

  describe('getActiveWindow', () => {
    it('should return information about the active window', () => {
      // Mock a successful window detection
      mockGetAllWindows.mockReturnValueOnce([{
        title: 'Test Window',
        className: 'TestClass',
        handle: 12345
      }]);
      
      // Create hardware instance to ensure get and getView are called
      const mockHardware = {
        workwindow: {
          set: mockSet,
          get: mockGet,
          getView: mockGetView,
          isForeground: vi.fn().mockReturnValue(true)
        }
      };
      
      // Replace hardware instance creation in the class
      vi.spyOn(keysender, 'Hardware').mockReturnValueOnce(mockHardware as any);
      
      const result = screenAutomation.getActiveWindow();
      
      expect(mockGetAllWindows).toHaveBeenCalled();
      // These will be called through the findSuitableWindow method
      expect(mockGet).toHaveBeenCalled();
      expect(mockGetView).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        title: 'Test Window',
        className: 'TestClass',
        handle: 12345,
        position: {
          x: 100,
          y: 200
        },
        size: {
          width: 800,
          height: 600
        }
      }));
    });
    
    it('should handle missing window information gracefully', () => {
      // Mock getAllWindows to return empty array
      mockGetAllWindows.mockReturnValueOnce([]);
      
      const result = screenAutomation.getActiveWindow();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        title: 'Unknown',
        className: 'Unknown',
        handle: 0,
        position: {
          x: 0,
          y: 0
        },
        size: {
          width: 0,
          height: 0
        }
      });
    });
  });
  
  describe('focusWindow', () => {
    it('should focus a window by title', () => {
      const result = screenAutomation.focusWindow('Test Window');
      
      expect(mockGetAllWindows).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
      expect(mockSetForeground).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toContain('Focused window');
    });
    
    it('should handle window not found', () => {
      // Mock getAllWindows to return empty array
      mockGetAllWindows.mockReturnValueOnce([]);
      
      const result = screenAutomation.focusWindow('Nonexistent Window');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Could not find window');
    });
  });
  
  describe('resizeWindow', () => {
    it('should resize a window to specified dimensions', () => {
      const result = screenAutomation.resizeWindow('Test Window', 1024, 768);
      
      expect(mockGetAllWindows).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
      expect(mockSetForeground).toHaveBeenCalled();
      expect(mockSetView).toHaveBeenCalledWith(expect.objectContaining({
        width: 1024,
        height: 768
      }));
      expect(result.success).toBe(true);
      expect(result.message).toContain('Resized window');
    });
  });
  
  describe('repositionWindow', () => {
    it('should reposition a window to specified coordinates', () => {
      const result = screenAutomation.repositionWindow('Test Window', 50, 100);
      
      expect(mockGetAllWindows).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
      expect(mockSetForeground).toHaveBeenCalled();
      expect(mockSetView).toHaveBeenCalledWith(expect.objectContaining({
        x: 50,
        y: 100
      }));
      expect(result.success).toBe(true);
      expect(result.message).toContain('Repositioned window');
    });
  });
});
