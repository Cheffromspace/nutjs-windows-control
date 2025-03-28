import clipboardy from 'clipboardy';
import { ClipboardInput } from '../../types/common.js';
import { WindowsControlResponse } from '../../types/responses.js';
import { ClipboardAutomation } from '../../interfaces/automation.js';

/**
 * Keysender implementation of the ClipboardAutomation interface
 * 
 * Note: Since keysender doesn't provide direct clipboard functionality,
 * we use the clipboardy library (same as the NutJS implementation)
 */
export class KeysenderClipboardAutomation implements ClipboardAutomation {
  async getClipboardContent(): Promise<WindowsControlResponse> {
    try {
      const content = await clipboardy.read();
      return {
        success: true,
        message: 'Clipboard content retrieved',
        data: { content }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get clipboard content: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async setClipboardContent(input: ClipboardInput): Promise<WindowsControlResponse> {
    try {
      await clipboardy.write(input.text);
      return {
        success: true,
        message: 'Clipboard content set'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to set clipboard content: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async hasClipboardText(): Promise<WindowsControlResponse> {
    try {
      const content = await clipboardy.read();
      const hasText = content.length > 0;
      return {
        success: true,
        message: `Clipboard ${hasText ? 'has' : 'does not have'} text`,
        data: { hasText }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to check clipboard: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async clearClipboard(): Promise<WindowsControlResponse> {
    try {
      await clipboardy.write('');
      return {
        success: true,
        message: 'Clipboard cleared'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear clipboard: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}
