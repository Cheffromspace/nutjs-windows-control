import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getScreenshot } from './screenshot';
import { createAutomationProvider } from '../providers/factory';

// Mock the factory module
vi.mock('../providers/factory', () => ({
  createAutomationProvider: vi.fn()
}));

describe('Screenshot Functions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('getScreenshot', () => {
    it('should delegate to provider and return screenshot data on success', async () => {
      // Setup mock provider
      const mockProvider = {
        screen: {
          getScreenshot: vi.fn().mockResolvedValue({
            success: true,
            message: "Screenshot captured successfully",
            content: [{
              type: "image",
              data: "test-image-data-base64",
              mimeType: "image/png"
            }]
          })
        }
      };
      
      // Make createAutomationProvider return our mock
      vi.mocked(createAutomationProvider).mockReturnValue(mockProvider as any);

      // Execute
      const result = await getScreenshot();

      // Verify
      expect(createAutomationProvider).toHaveBeenCalledTimes(1);
      expect(mockProvider.screen.getScreenshot).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        message: "Screenshot captured successfully",
        content: [{
          type: "image",
          data: "test-image-data-base64",
          mimeType: "image/png"
        }]
      });
    });


    it('should pass options to provider when specified', async () => {
      // Setup mock provider
      const mockProvider = {
        screen: {
          getScreenshot: vi.fn().mockResolvedValue({
            success: true,
            message: "Screenshot captured successfully",
            content: [{
              type: "image",
              data: "test-image-data-base64",
              mimeType: "image/jpeg"
            }]
          })
        }
      };
      
      // Make createAutomationProvider return our mock
      vi.mocked(createAutomationProvider).mockReturnValue(mockProvider as any);

      // Options to pass
      const options = {
        region: { x: 100, y: 100, width: 800, height: 600 },
        format: 'jpeg' as const
      };

      // Execute
      const result = await getScreenshot(options);

      // Verify
      expect(createAutomationProvider).toHaveBeenCalledTimes(1);
      expect(mockProvider.screen.getScreenshot).toHaveBeenCalledWith(options);
      expect(result).toEqual({
        success: true,
        message: "Screenshot captured successfully",
        content: [{
          type: "image",
          data: "test-image-data-base64",
          mimeType: "image/jpeg"
        }]
      });
    });

    it('should return error response when provider throws an error', async () => {
      // Setup mock provider that throws
      const mockProvider = {
        screen: {
          getScreenshot: vi.fn().mockImplementation(() => {
            throw new Error('Capture failed');
          })
        }
      };
      
      // Make createAutomationProvider return our mock
      vi.mocked(createAutomationProvider).mockReturnValue(mockProvider as any);

      // Execute
      const result = await getScreenshot();

      // Verify
      expect(result).toEqual({
        success: false,
        message: "Failed to capture screenshot: Capture failed"
      });
    });
  });
});
