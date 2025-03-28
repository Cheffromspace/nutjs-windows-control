interface ImageContent {
  type: "image";
  data: string;  // base64 encoded image data
  mimeType: string;
}

export interface ScreenshotResponse {
  screenshot: string;  // base64 encoded image data
  timestamp: string;
}

export interface WindowsControlResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  screenshot?: string;  // base64 encoded image data for screenshot responses
  encoding?: string;    // encoding type for screenshot data (e.g., 'base64')
  content?: ImageContent[];  // MCP image content for screenshots
  timestamp?: string;  // ISO timestamp for screenshot responses
}
