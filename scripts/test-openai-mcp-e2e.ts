import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import OpenAI from "openai";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runE2E() {
  console.log("=== KINGDRAGONHUB MCP - OPENAI RESPONSES API E2E TEST ===\n");

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment variables.");
  }

  if (!process.env.KINGDRAGON_MCP_URL) {
    throw new Error(
      "Missing KINGDRAGON_MCP_URL in environment variables.\n" +
      "If you are running locally, you must use a Secure MCP Tunnel (like ngrok) " +
      "and set KINGDRAGON_MCP_URL=https://<your-ngrok-url>/api/mcp"
    );
  }

  if (!process.env.MCP_SECRET_KEY) {
    throw new Error("Missing MCP_SECRET_KEY in environment variables.");
  }

  console.log(`Connecting to OpenAI using MCP URL: ${process.env.KINGDRAGON_MCP_URL}\n`);

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const mcpTool: any = {
    type: "mcp" as const,
    server_label: "kingdragonhub",
    server_description:
      "KingDragonHub editorial MCP for reading blog inventory, editorial policy, related posts, and creating review-only drafts.",
    server_url: process.env.KINGDRAGON_MCP_URL,
    authorization: process.env.MCP_SECRET_KEY,
    allowed_tools: [
      "get_editorial_guidelines",
      "get_blog_inventory",
      "get_related_posts",
      "create_blog_draft",
    ],
    require_approval: {
      never: {
        tool_names: [
          "get_editorial_guidelines",
          "get_blog_inventory",
          "get_related_posts",
        ],
      },
    },
  };

  console.log("Starting model execution...");
  
  // 1. BOOTSTRAP: Seed a real content_task for testing
  const { data: task, error: taskError } = await supabase.from('content_tasks').insert([{
    topic_name: "MODEL_E2E_01_TEST",
    status: "pending",
    priority: 5,
    type: "BLOG"
  }]).select('id').single();

  if (taskError) {
    throw new Error("Failed to seed content_task: " + taskError.message);
  }
  const realTaskId = task.id;
  const hostIdempotencyKey = "E2E-IDEMP-" + Date.now();

  console.log(`[BOOTSTRAP] Seeded Task ID: ${realTaskId}`);
  console.log(`[BOOTSTRAP] Generated Idempotency Key: ${hostIdempotencyKey}\n`);

  let response = await client.responses.create({
    model: "gpt-5.6",
    tools: [mcpTool],
    input: `
You are the editorial agent for KingDragonHub.

This is an E2E validation run.

Required sequence:
1. Read the active editorial policy.
2. Inspect the current blog inventory.
3. Find existing articles related to AI in education.
4. Propose ONE small test article that does not duplicate existing content.
   - Title prefix: [E2E TEST]
   - Category: AI / Education
   - Length: 500-800 words
   - 3-5 references
   - 2 internal links
5. Prepare the article according to the retrieved editorial policy.
6. Request creation of a DRAFT using create_blog_draft.

Strict Configuration Constraints:
- Use this task_id exactly: ${realTaskId}
- Use this idempotency_key exactly: ${hostIdempotencyKey}
- Do not invent or replace the task_id or idempotency_key.
- Never request publication (is_published must be false).
- Never invent policy values.
- Use the exact policy_version and policy_hash returned by the MCP server.
    `,
  });

  // Log the output timeline
  console.log("\n[Timeline] Output items from first run:");
  let foundApproval = null;

  for (const item of response.output) {
    if ((item.type as string) === "mcp_list_tools") {
      console.log(`[MCP LIST TOOLS] Server: ${item.server_label}`);
    } else if ((item.type as string) === "mcp_call") {
      console.log(`[MCP CALL] ${item.name} -> ID: ${item.id}`);
    } else if ((item.type as string) === "mcp_call_response") {
      console.log(`[MCP CALL RESPONSE] For Call ID: ${item.call_id}`);
    } else if ((item.type as string) === "mcp_approval_request") {
      console.log(`\n[APPROVAL REQUIRED] Tool: ${item.name}`);
      console.log("Arguments:\n", JSON.stringify(item.arguments, null, 2));
      foundApproval = item;
    } else if (item.type === "text") {
      console.log(`\n[MODEL TEXT] ${item.text}`);
    }
  }

  if (!foundApproval) {
    console.log("\nNo approval request found in the response!");
    console.dir(response.output, { depth: null });
    process.exit(1);
  }

  if (foundApproval.name !== "create_blog_draft") {
    throw new Error(`Unexpected write approval requested: ${foundApproval.name}`);
  }

  console.log("\n[APPROVED] Approving create_blog_draft automatically for E2E...");

  // Send the approval response to continue execution
  const continuation = await client.responses.create({
    model: "gpt-5.6",
    tools: [mcpTool],
    previous_response_id: response.id,
    input: [
      {
        type: "mcp_approval_response" as any,
        approval_request_id: foundApproval.id,
        approve: true,
      },
    ],
  });

  console.log("\n[Timeline] Output items from continuation:");
  for (const item of continuation.output) {
    if (item.type === "mcp_call") {
      console.log(`[MCP CALL] ${item.name} -> ID: ${item.id}`);
    } else if (item.type === "mcp_call_response") {
      console.log(`[MCP CALL RESPONSE] For Call ID: ${item.call_id}`);
      if (item.response?.content) {
        console.log("Response Content:", JSON.stringify(item.response.content, null, 2));
      }
    } else if (item.type === "text") {
      console.log(`\n[MODEL FINAL TEXT] ${item.text}`);
    } else {
      console.log(`[ITEM TYPE] ${item.type}`);
    }
  }

  console.log("\n=== MODEL_E2E_01 FINISHED ===");
}

runE2E().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
