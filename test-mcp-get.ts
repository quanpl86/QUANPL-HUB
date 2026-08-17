import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
const server = new McpServer({ name: "test", version: "1" });
const handler = createMcpHandler(server);

async function test() {
  const req = new Request("http://localhost/api/mcp", {
    method: "GET",
    headers: { "Accept": "text/event-stream" }
  });
  const res = await handler.fetch(req);
  console.log(res.status);
  console.log(await res.text());
}
test();
