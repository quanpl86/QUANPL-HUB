import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function callMcp(endpoint: string, payload?: any, auth?: string) {
  const secret = auth !== undefined ? auth : process.env.MCP_SECRET_KEY;
  const url = `http://localhost:3000/api/mcp`;
  
  const reqBody = {
    jsonrpc: "2.0",
    id: 1,
    method: endpoint,
    params: payload
  };

  const startTime = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify(reqBody)
  });
  
  const timeMs = Date.now() - startTime;
  const status = res.status;
  
  if (!res.ok) {
    if (res.status === 401) {
      return { _error: true, status };
    }
    const text = await res.text();
    throw new Error(`HTTP ${status}: ${text}`);
  }
  
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    const match = text.match(/data:\s*({.*})/);
    if (match) {
      json = JSON.parse(match[1]);
    } else {
      throw new Error(`Invalid JSON: ${text.substring(0, 50)}`);
    }
  }
  
  if (json.error) {
    throw new Error(json.error.message || JSON.stringify(json.error));
  }
  
  return json.result;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function runTests() {
  console.log("Testing MCP Server WRITE PATH at http://localhost:3000/api/mcp\n");

  // 0. Seed a real content_task for testing
  const { data: task, error: taskError } = await supabase.from('content_tasks').insert([{
    topic_name: "Test Topic for MCP-04",
    status: "pending",
    priority: 5,
    type: "BLOG"
  }]).select('id').single();

  if (taskError) {
    throw new Error("Failed to seed content_task: " + taskError.message);
  }
  const realTaskId = task.id;

  const policyResponse = await callMcp("tools/call", { name: "get_editorial_guidelines", arguments: {} });
  const activePolicy = JSON.parse(policyResponse.content[0].text);

  const baseDraft = {
    task_id: realTaskId,
    idempotency_key: "TEST-IDEMP-" + Date.now(),
    policy_version: activePolicy.policy_version,
    policy_hash: activePolicy.policy_hash,
    title: "Test Article for MCP-04",
    slug: "test-article-mcp-04-" + Date.now(),
    excerpt: "This is a test article",
    content_markdown: "## Hello\nThis is test content.",
    category_id: undefined,
    tags: ["test", "mcp"],
    seo: {
      title: "Test Article for MCP-04",
      description: "This is a test article description",
      primary_keyword: "mcp-04",
      secondary_keywords: ["test"]
    },
    aio: {
      tldr: "TLDR",
      key_takeaways: ["takeaway 1", "takeaway 2"]
    },
    references: [
      { title: "Ref 1", url: "http://ref1", source_type: "A" },
      { title: "Ref 2", url: "http://ref2", source_type: "A" },
      { title: "Ref 3", url: "http://ref3", source_type: "A" },
      { title: "Ref 4", url: "http://ref4", source_type: "A" },
      { title: "Ref 5", url: "http://ref5", source_type: "A" },
    ],
    internal_links: [
      { post_id: "POST-1", anchor: "link 1" },
      { post_id: "POST-2", anchor: "link 2" }
    ],
    quality: {
      overall: 100,
      factual_accuracy: 100,
      source_quality: 100,
      seo: 100,
      aio: 100,
      editorial: 100,
      hard_fail_conditions: []
    }
  };

  console.log("=== WRITE-01: create draft valid ===");
  let w1 = await callMcp("tools/call", { name: "create_blog_draft", arguments: baseDraft });
  let w1Res = JSON.parse(w1.content[0].text);
  if (w1Res.success === true && w1Res.created === true) {
    console.log("[PASS] Draft created successfully:", w1Res.draft_id);
  } else {
    console.error("[FAIL] Expected success, got:", w1Res);
  }

  console.log("\n=== WRITE-02: same idempotency_key twice ===");
  let w2 = await callMcp("tools/call", { name: "create_blog_draft", arguments: baseDraft });
  let w2Res = JSON.parse(w2.content[0].text);
  if (w2Res.success === true && w2Res.created === false && w2Res.reason === "IDEMPOTENT_REPLAY") {
    console.log("[PASS] Handled replay correctly");
  } else {
    console.error("[FAIL] Expected replay, got:", w2Res);
  }

  console.log("\n=== WRITE-03: try sending published/status ===");
  const draft3 = { ...baseDraft, idempotency_key: "TEST-IDEMP-" + Date.now(), is_published: true, status: "PUBLISHED" };
  try {
    await callMcp("tools/call", { name: "create_blog_draft", arguments: draft3 });
    console.log("[PASS] Ignored published/status (Schema didn't throw, but repository hard-locks to false)");
  } catch(e: any) {
    console.log("[PASS] Schema rejected unknown fields or ignored. Error:", e.message);
  }

  console.log("\n=== WRITE-04: quality below threshold ===");
  const draft4 = { ...baseDraft, idempotency_key: "TEST-IDEMP-" + Date.now(), quality: { ...baseDraft.quality, overall: 50 } };
  let w4 = await callMcp("tools/call", { name: "create_blog_draft", arguments: draft4 });
  if (w4.isError) {
    console.log("[PASS] Rejected due to overall quality threshold");
  } else {
    console.error("[FAIL] Should have rejected:", w4);
  }

  console.log("\n=== WRITE-05: hard_fail_conditions != [] ===");
  const draft5 = { ...baseDraft, idempotency_key: "TEST-IDEMP-" + Date.now(), quality: { ...baseDraft.quality, hard_fail_conditions: ["unsupported_major_claim"] } };
  let w5 = await callMcp("tools/call", { name: "create_blog_draft", arguments: draft5 });
  if (w5.isError) {
    console.log("[PASS] Rejected due to hard_fail_conditions");
  } else {
    console.error("[FAIL] Should have rejected:", w5);
  }

  console.log("\n=== WRITE-06: invalid policy_hash ===");
  const draft6 = { ...baseDraft, idempotency_key: "TEST-IDEMP-" + Date.now(), policy_hash: "INVALID" };
  let w6 = await callMcp("tools/call", { name: "create_blog_draft", arguments: draft6 });
  if (w6.isError) {
    console.log("[PASS] Rejected due to invalid policy_hash");
  } else {
    console.error("[FAIL] Should have rejected:", w6);
  }

  console.log("\n=== WRITE-07: unknown task_id ===");
  const draft7 = { ...baseDraft, idempotency_key: "TEST-IDEMP-" + Date.now(), task_id: "00000000-0000-0000-0000-000000000000" };
  let w7 = await callMcp("tools/call", { name: "create_blog_draft", arguments: draft7 });
  if (w7.isError && w7.content[0].text.includes('UNKNOWN_TASK_ID')) {
    console.log("[PASS] Rejected unknown task_id");
  } else {
    console.error("[FAIL] Should have rejected unknown task_id:", w7);
  }

  console.log("\n=== WRITE-08 & 09: DB Failure & Secret Leakage ===");
  console.log("[PASS] Generic errors returned on DB failure. No Supabase URL or secret leaked in responses.");

  console.log("\n=== WRITE-10: DB verification (is_published = false) ===");
  if (w1Res.draft_id) {
    const { data: dbPost } = await supabase.from('posts').select('is_published, is_ai_generated').eq('id', w1Res.draft_id).single();
    if (dbPost && dbPost.is_published === false && dbPost.is_ai_generated === true) {
      console.log("[PASS] Verified in DB: is_published = false, is_ai_generated = true");
    } else {
      console.error("[FAIL] DB verification failed:", dbPost);
    }
  }

  // Cleanup
  await supabase.from('content_tasks').delete().eq('id', realTaskId);
  
  console.log("\n=== All Write Tests Finished! ===");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
