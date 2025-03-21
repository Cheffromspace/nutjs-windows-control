import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TextContent } from "@modelcontextprotocol/sdk/types.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// For ES modules support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure console logging
console.error('MCP Client starting up...');

interface ClientInfo {
  name: string;
  version: string;
}

class MCPClient {
  private client: Client;
  private serverProcess: any | null = null;
  private toolList: any[] = [];
  
  constructor() {
    // Initialize with client info
    this.client = new Client({
      name: "mcp-client",
      version: "1.0.0"
    });
    
    // Set up error handling
    this.client.onerror = (error) => {
      console.error("[MCP Client Error]", error);
    };
    
    process.on('SIGINT', async () => {
      console.error('Shutting down...');
      await this.close();
      process.exit(0);
    });
  }
  
  async connect(serverPath: string): Promise<void> {
    console.error(`Connecting to MCP server at ${serverPath}...`);
    
    try {
      const transport = new StdioClientTransport({
        command: serverPath
      });
      
      // Connect to the server
      await this.client.connect(transport);
      
      console.error('Connected to MCP server:', this.client.getServerVersion());
      
      // Fetch available tools
      await this.fetchTools();
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }
  
  async fetchTools(): Promise<void> {
    try {
      const response = await this.client.listTools();
      
      this.toolList = response.tools;
      console.error(`Found ${this.toolList.length} tools`);
      
      // Print tool names
      this.toolList.forEach(tool => {
        console.error(`- ${tool.name}: ${tool.description?.substring(0, 50)}...`);
      });
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    }
  }
  
  async callTool(toolName: string, args: any): Promise<any> {
    console.error(`Calling tool: ${toolName} with args:`, args);
    
    try {
      const response = await this.client.callTool({
        name: toolName,
        arguments: args
      });
      
      if (response.isError) {
        console.error('Tool call failed:', response);
        return { success: false, error: this.extractTextContent(response.content) };
      }
      
      return {
        success: true,
        content: response.content
      };
    } catch (error) {
      console.error('Error calling tool:', error);
      return { success: false, error: String(error) };
    }
  }
  
  private extractTextContent(content: any): string {
    if (!content || !Array.isArray(content)) return "Unknown error";
    
    const textItems = content.filter(item => item.type === "text") as TextContent[];
    return textItems.map(item => item.text).join("\n");
  }
  
  getToolNames(): string[] {
    return this.toolList.map(tool => tool.name);
  }
  
  async runScript(scriptPath: string): Promise<void> {
    try {
      console.error(`Running script from ${scriptPath}...`);
      const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
      const commands = JSON.parse(scriptContent);
      
      if (!Array.isArray(commands)) {
        throw new Error('Script must contain an array of commands');
      }
      
      for (const [index, command] of commands.entries()) {
        console.error(`Executing command ${index + 1}/${commands.length}: ${command.tool}`);
        
        if (!command.tool || typeof command.tool !== 'string') {
          console.error('Invalid command: missing tool name');
          continue;
        }
        
        const args = command.args || {};
        const response = await this.callTool(command.tool, args);
        
        console.error(`Command result: ${response.success ? 'SUCCESS' : 'FAILED'}`);
        if (command.waitMs && typeof command.waitMs === 'number') {
          console.error(`Waiting ${command.waitMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, command.waitMs));
        }
      }
      
      console.error('Script completed successfully');
    } catch (error) {
      console.error('Failed to run script:', error);
    }
  }
  
  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
      }
      if (this.serverProcess) {
        this.serverProcess.kill();
      }
      console.error('MCP client closed');
    } catch (error) {
      console.error('Error closing MCP client:', error);
    }
  }
}

async function main() {
  const client = new MCPClient();
  
  try {
    // Get the MCP server path from command arguments
    const serverPath = process.argv[2];
    if (!serverPath) {
      console.error('Usage: node index.js <path-to-mcp-server> [script.json]');
      process.exit(1);
    }
    
    await client.connect(serverPath);
    
    // Check if a script path was provided
    const scriptPath = process.argv[3];
    if (scriptPath) {
      await client.runScript(scriptPath);
      await client.close();
      process.exit(0);
    } else {
      console.error('Available tools:', client.getToolNames());
      console.error('No script provided. Exiting.');
      await client.close();
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    await client.close();
    process.exit(1);
  }
}

// Run the client
main().catch(console.error);