import { MousePosition, KeyboardInput, KeyCombination, KeyHoldOperation, ScreenshotOptions, ClipboardInput } from '../types/common.js';
import { WindowsControlResponse } from '../types/responses.js';

export interface KeyboardAutomation {
  typeText(input: KeyboardInput): WindowsControlResponse;
  pressKey(key: string): WindowsControlResponse;
  pressKeyCombination(combination: KeyCombination): Promise<WindowsControlResponse>;
  holdKey(operation: KeyHoldOperation): Promise<WindowsControlResponse>;
}

export interface MouseAutomation {
  moveMouse(position: MousePosition): WindowsControlResponse;
  clickMouse(button?: 'left' | 'right' | 'middle'): WindowsControlResponse;
  doubleClick(position?: MousePosition): WindowsControlResponse;
  getCursorPosition(): WindowsControlResponse;
  scrollMouse(amount: number): WindowsControlResponse;
  dragMouse(from: MousePosition, to: MousePosition, button?: 'left' | 'right' | 'middle'): WindowsControlResponse;
  clickAt(x: number, y: number, button?: 'left' | 'right' | 'middle'): WindowsControlResponse;
}

export interface ScreenAutomation {
  getScreenSize(): WindowsControlResponse;
  getActiveWindow(): WindowsControlResponse;
  focusWindow(title: string): WindowsControlResponse;
  resizeWindow(title: string, width: number, height: number): WindowsControlResponse;
  repositionWindow(title: string, x: number, y: number): WindowsControlResponse;
  getScreenshot(options?: ScreenshotOptions): Promise<WindowsControlResponse>;
  getAllDisplays(): WindowsControlResponse;
}

export interface ClipboardAutomation {
  getClipboardContent(): Promise<WindowsControlResponse>;
  setClipboardContent(input: ClipboardInput): Promise<WindowsControlResponse>;
  hasClipboardText(): Promise<WindowsControlResponse>;
  clearClipboard(): Promise<WindowsControlResponse>;
}
