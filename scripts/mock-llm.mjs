// Minimal OpenAI-compatible mock used to test the /api/explain integration path offline.
// Usage: node scripts/mock-llm.mjs   (listens on :3201, base URL http://localhost:3201/v1)
import { createServer } from "node:http";

createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const json = JSON.parse(body || "{}");
    const ok = req.url === "/v1/chat/completions" && req.headers.authorization === "Bearer test-key" && json.temperature === 0;
    console.log(`mock-llm ${req.method} ${req.url} model=${json.model} temperature=${json.temperature} ok=${ok}`);
    res.writeHead(ok ? 200 : 400, { "content-type": "application/json" });
    res.end(
      JSON.stringify(
        ok
          ? { choices: [{ message: { content: "MOCK NARRATIVE: provisional proposal based only on supplied facts; requires human review." } }] }
          : { error: "bad request" },
      ),
    );
  });
}).listen(3201, () => console.log("mock-llm listening on :3201"));
