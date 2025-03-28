import { createAutomationProvider } from '../providers/factory.js';
import { ScreenshotOptions } from '../types/common.js';
import { WindowsControlResponse } from '../types/responses.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Captures a screenshot and saves it to a temporary file
 * 
 * @param options Optional configuration for the screenshot
 * @returns Promise resolving to a WindowsControlResponse with the file path
 */
export async function getScreenshotToFile(options?: ScreenshotOptions): Promise<WindowsControlResponse> {
  try {
    // Create a provider instance to handle the screenshot
    const provider = createAutomationProvider();
    
    // Delegate to the provider's screenshot implementation
    const result = await provider.screen.getScreenshot(options);
    
    // If the screenshot was successful and contains image data
    if (result.success && result.content && result.content[0]?.type === "image") {
      // Create a unique filename in the system's temp directory
      const tempDir = os.tmpdir();
      const fileExt = options?.format === 'png' ? 'png' : 'jpg';
      const filename = `screenshot-${uuidv4()}.${fileExt}`;
      const filePath = path.join(tempDir, filename);
      
      // Get the base64 image data and ensure it's a string
      let base64Image: string;
      
      try {
        const imageData = result.content[0].data;
        
        // Validate the data is a string
        if (typeof imageData !== 'string') {
          return {
            success: false,
            message: 'Screenshot data is not in expected string format'
          };
        }
        
        // Remove the data URL prefix if present
        base64Image = imageData.includes('base64,') 
          ? imageData.split('base64,')[1] 
          : imageData;
      } catch {
        return {
          success: false,
          message: 'Failed to process screenshot data'
        };
      }
      
      // Write the image data to the file
      fs.writeFileSync(filePath, Buffer.from(base64Image, 'base64'));
      
      // Extract dimensions safely
      const width = result.data && 'width' in result.data && typeof result.data.width !== 'undefined'
        ? Number(result.data.width)
        : undefined;
      
      const height = result.data && 'height' in result.data && typeof result.data.height !== 'undefined'
        ? Number(result.data.height)
        : undefined;
      
      // Return a response with the file path instead of the image data
      return {
        success: true,
        message: "Screenshot saved to temporary file",
        data: {
          filePath,
          format: options?.format || 'jpeg',
          width,
          height,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // If the screenshot failed or doesn't contain image data, return the original result
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred while capturing screenshot';
      
    return {
      success: false,
      message: `Failed to capture screenshot to file: ${errorMessage}`
    };
  }
}
