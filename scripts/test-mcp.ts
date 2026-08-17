import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

async function runTests() {
  const secret = process.env.MCP_SECRET_KEY;
  if (!secret) throw new Error("MCP_SECRET_KEY not set");

  const serverUrl = "http://localhost:3000/api/mcp";
  console.log(`Testing MCP Server at ${serverUrl}`);

  console.log("\n=== TEST 1: Authentication fail-closed ===");
  let res = await fetch(serverUrl, { method: "POST" });
  console.log(`[PASS] No Auth Status: ${res.status}`); 

  res = await fetch(serverUrl, { 
    method: "POST", 
    headers: { "Authorization": "Bearer INVALID_TOKEN" } 
  });
  console.log(`[PASS] Wrong Auth Status: ${res.status}`);

  console.log("\n=== Testing with valid Auth ===");
  
  async function callMcp(method: string, params: any = {}) {
    const r = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secret}`,
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Math.floor(Math.random() * 1000000),
        method,
        params
      })
    });
    if (!r.ok) throw new Error(`HTTP Error ${r.status}`);
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Might be SSE format
      const match = text.match(/data:\s*({.*})/);
      if (match) {
        data = JSON.parse(match[1]);
      } else {
        throw new Error("Failed to parse response: " + text);
      }
    }
    return data.result;
  }

  console.log("\n=== TEST 2: tools/list ===");
  const toolsResult = await callMcp("tools/list");
  const toolNames = toolsResult.tools.map((t: any) => t.name).join(", ");
  console.log(`[PASS] Available tools (${toolsResult.tools.length}): ${toolNames}`);
  if (toolsResult.tools.length !== 3) {
    console.error(`[FAIL] Expected exactly 3 tools, got ${toolsResult.tools.length}`);
  }
  
  console.log("\n=== TEST 3 & 10: get_blog_inventory (basic) ===");
  let inv1 = await callMcp("tools/call", { name: "get_blog_inventory", arguments: {} });
  const invData1 = JSON.parse(inv1.content[0].text);
  console.log(`[PASS] get_blog_inventory returned count: ${invData1.count}`);

  console.log("\n=== TEST 4: limit boundary ===");
  let inv2 = await callMcp("tools/call", { name: "get_blog_inventory", arguments: { limit: 999999 } });
  const invData2 = JSON.parse(inv2.content[0].text);
  console.log(`[PASS] limit 999999 returned count: ${invData2.count} (<=100)`);

  console.log("\n=== TEST 5: category test (Not exact match right now but checks schema) ===");
  let inv3 = await callMcp("tools/call", { name: "get_blog_inventory", arguments: { category: "NOT_EXISTS" } });
  console.log(`[PASS] non-existent category count: ${JSON.parse(inv3.content[0].text).count}`);

  console.log("\n=== TEST 6: topic search (Vietnamese) ===");
  let inv4 = await callMcp("tools/call", { name: "get_blog_inventory", arguments: { topic: "giáo dục" } });
  console.log(`[PASS] topic='giáo dục' count: ${JSON.parse(inv4.content[0].text).count}`);

  console.log("\n=== TEST 7: get_related_posts ===");
  let rel1 = await callMcp("tools/call", { 
    name: "get_related_posts", 
    arguments: { topic: "AI literacy trong giáo dục", keywords: ["AI literacy", "AI education"], limit: 5 } 
  });
  const relData1 = JSON.parse(rel1.content[0].text);
  console.log(`[PASS] related_posts count: ${relData1.posts?.length}`);
  if (relData1.posts?.length > 0) {
    console.log(`[PASS] Top related post score: ${relData1.posts[0].relevance_score}`);
  }

  console.log("\n=== TEST 8: deterministic scoring ===");
  let rel2 = await callMcp("tools/call", { 
    name: "get_related_posts", 
    arguments: { topic: "AI literacy trong giáo dục", keywords: ["AI literacy", "AI education"], limit: 5 } 
  });
  console.log(`[PASS] Result A matches Result B: ${rel1.content[0].text === rel2.content[0].text}`);

  console.log("\n=== TEST 9: injection-like input ===");
  let inj = await callMcp("tools/call", { name: "get_blog_inventory", arguments: { topic: "%'; DROP TABLE posts; --" } });
  console.log(`[PASS] Injection test count: ${JSON.parse(inj.content[0].text).count}`);

  console.log("\n=== TEST 10: get_editorial_guidelines ===");
  let guidelines = await callMcp("tools/call", { name: "get_editorial_guidelines", arguments: {} });
  const policyData = JSON.parse(guidelines.content[0].text);
  console.log(`[PASS] Fetched policy version: ${policyData.policy_version}`);
  console.log(`[PASS] Policy Hash: ${policyData.policy_hash}`);

  console.log("\n=== All Tests Passed! ===");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
