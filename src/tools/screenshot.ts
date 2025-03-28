import { createAutomationProvider } from '../providers/factory.js';
import { ScreenshotOptions } from '../types/common.js';
import { WindowsControlResponse } from '../types/responses.js';

/**
 * Captures a screenshot with various options for optimization
 * 
 * @param options Optional configuration for the screenshot
 * @returns Promise resolving to a WindowsControlResponse with the screenshot data
 */
export async function getScreenshot(options?: ScreenshotOptions): Promise<WindowsControlResponse> {
  try {
    // Create a provider instance to handle the screenshot
    const provider = createAutomationProvider();
    
    // Delegate to the provider's screenshot implementation
    const response = await provider.screen.getScreenshot(options);

  // Return the standard MCP response from the provider
  return response;
  } catch (error) {
    return {
      success: false,
      message: `Failed to capture screenshot: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
