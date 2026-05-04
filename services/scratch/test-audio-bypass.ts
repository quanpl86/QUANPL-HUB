import { generateAudio, getAudioStatus, initMCPClient } from '../mcp-client.js';

async function testAudio() {
  console.log("Starting MCP client...");
  await initMCPClient();

  console.log("Testing audio generation bypass...");
  try {
    // The UUID for "Podcast: Chiến Lược..." in the Google account
    const notebookUrl = "https://notebooklm.google.com/notebook/5883084c-c349-4e8f-9c85-4eb77727a9e9";
    
    console.log(`Sending direct URL to generateAudio: ${notebookUrl}`);
    const result = await generateAudio(notebookUrl);
    console.log("Generate Result:", JSON.stringify(result, null, 2));

    console.log("Checking status...");
    const status = await getAudioStatus(notebookUrl);
    console.log("Status Result:", JSON.stringify(status, null, 2));
    
  } catch (error) {
    console.error("Test failed:", error);
  }
  process.exit(0);
}

testAudio();
