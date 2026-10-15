import assert from "node:assert/strict";
import { request } from "node:http";
import test from "node:test";

import { createTodoServer } from "../scripts/server.mjs";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function get(server, path) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const clientRequest = request(
      {
        host: "127.0.0.1",
        port: address.port,
        path,
        method: "GET",
        agent: false,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    clientRequest.on("error", reject);
    clientRequest.end();
  });
}

test("server serves the Todo page at the root", async (t) => {
  const server = createTodoServer();
  await listen(server);
  t.after(() => close(server));

  const response = await get(server, "/");

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"], /^text\/html/);
  assert.match(response.body, /<h1>Todo<\/h1>/);
  assert.match(response.headers["content-security-policy"], /default-src 'self'/);
});

test("server serves the focus policy module required by the browser app", async (t) => {
  const server = createTodoServer();
  await listen(server);
  t.after(() => close(server));

  const response = await get(server, "/focus-policy.js");

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"], /^text\/javascript/);
  assert.match(response.body, /export function restoreFocus/);
});

test("server returns 404 for an unknown path", async (t) => {
  const server = createTodoServer();
  await listen(server);
  t.after(() => close(server));

  const response = await get(server, "/unknown");
  assert.equal(response.statusCode, 404);
});

test("server allowlist blocks encoded path traversal attempts", async (t) => {
  const server = createTodoServer();
  await listen(server);
  t.after(() => close(server));

  for (const path of ["/%2e%2e/package.json", "/..%2Fpackage.json"]) {
    const response = await get(server, path);
    assert.equal(response.statusCode, 404, path);
    assert.equal(response.body, "Not found\n", path);
  }
});

test("server rejects a network-path request target", async (t) => {
  const server = createTodoServer();
  await listen(server);
  t.after(() => close(server));

  const response = await get(server, "//example.test/");
  assert.equal(response.statusCode, 400);
});
