import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";

const HOST = "127.0.0.1";
const PORT = 4173;

const files = new Map([
  ["/", { url: new URL("../app/index.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/index.html", { url: new URL("../app/index.html", import.meta.url), type: "text/html; charset=utf-8" }],
  ["/styles.css", { url: new URL("../app/styles.css", import.meta.url), type: "text/css; charset=utf-8" }],
  ["/app.js", { url: new URL("../app/app.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
  ["/todo-model.js", { url: new URL("../app/todo-model.js", import.meta.url), type: "text/javascript; charset=utf-8" }],
]);

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function sendText(response, statusCode, message, method = "GET") {
  response.writeHead(statusCode, {
    ...securityHeaders,
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(message),
  });
  response.end(method === "HEAD" ? undefined : message);
}

export function createTodoServer() {
  return createServer(async (request, response) => {
    const method = request.method ?? "GET";
    if (method !== "GET" && method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD");
      sendText(response, 405, "Method not allowed\n", method);
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(request.url ?? "/", `http://${HOST}`);
    } catch {
      sendText(response, 400, "Bad request\n", method);
      return;
    }

    if (parsedUrl.origin !== `http://${HOST}`) {
      sendText(response, 400, "Bad request\n", method);
      return;
    }

    const entry = files.get(parsedUrl.pathname);
    if (!entry) {
      sendText(response, 404, "Not found\n", method);
      return;
    }

    const path = fileURLToPath(entry.url);
    try {
      const metadata = await stat(path);
      response.writeHead(200, {
        ...securityHeaders,
        "Cache-Control": "no-store",
        "Content-Type": entry.type,
        "Content-Length": metadata.size,
      });

      if (method === "HEAD") {
        response.end();
        return;
      }

      const stream = createReadStream(path);
      stream.on("error", () => {
        response.destroy();
      });
      stream.pipe(response);
    } catch {
      sendText(response, 500, "Internal server error\n", method);
    }
  });
}

export function startServer({ host = HOST, port = PORT } = {}) {
  const server = createTodoServer();
  server.listen(port, host, () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : port;
    console.log(`Todo app available at http://${host}:${activePort}`);
  });
  return server;
}

const isEntryPoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  const requestedPort = process.env.PORT === undefined ? PORT : Number(process.env.PORT);
  if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
    console.error("PORT must be an integer between 0 and 65535.");
    process.exitCode = 1;
  } else {
    startServer({ host: process.env.HOST || HOST, port: requestedPort });
  }
}
