import { McpServer } from "@modelcontextprotocol/server";
const server = new McpServer({ name: "test", version: "1" });
console.log(Object.keys(server));
console.log(typeof server.tool);
console.log(typeof (server as any).registerTool);
