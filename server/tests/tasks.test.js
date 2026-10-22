import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const serverDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), ".."
);

function createTasks(count) {
  const rows = ["id,title,description,answer"];

  for (let i = 1; i <= count; i++) {
    rows.push(`${i},Task ${i},Description ${i},answer${i}`);
  }

  return rows.join("\n") + "\n";
}

async function getFreePort() {
  const socket = net.createServer();
  await new Promise(resolve =>
    socket.listen(0, "127.0.0.1", resolve)
  );
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  return port;
}

test("Sprint 3 - Hunt Task Storage Tests", async (t) => {
  const dataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "buchunt-test-")
  );

  const port = await getFreePort();

  const server = spawn(
    process.execPath,
    [path.join(serverDir, "index.js")],
    {
      cwd: serverDir,
      env: {
        ...process.env,
        DATA_DIR: dataDir,
        PORT: String(port),
        NODE_ENV: "test"
      },
      stdio: "ignore"
    }
  );

  t.after(async () => {
    server.kill();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  async function getTasks(code) {
    return fetch(
      `http://127.0.0.1:${port}/api/hunts/${code}/tasks`,
      {
        headers: { "x-user-phone": "4235551234" }
      }
    );
  }

  async function createHunt(code, count) {
    const folder = path.join(dataDir, "hunts", code);
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(
      path.join(folder, "tasks.csv"),
      createTasks(count)
    );
  }

  // Wait for the backend to start.
  let ready = false;

  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) break;

    try {
      await getTasks("READY");
      ready = true;
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  assert.ok(ready, "Backend server failed to start");

  // Test 1: Missing tasks should be detected.
  await t.test("Missing tasks file returns 404", async () => {
    const response = await getTasks("MISSING");

    assert.equal(response.status, 404);

    const data = await response.json();
    assert.equal(data.error, "Hunt not found.");
  });

  // Test 2: Empty task list should be detected.
  await t.test("Empty task list is detected", async () => {
    await createHunt("EMPTY", 0);

    const response = await getTasks("EMPTY");
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.tasks.length, 0);
    assert.equal(data.tasks.length > 0, false);
  });

  // Test 3: Verify 10 tasks exist.
  await t.test("Server stores and retrieves 10 tasks", async () => {
    await createHunt("TEN", 10);

    const response = await getTasks("TEN");
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.tasks.length, 10);

    const ids = data.tasks.map(task => task.id);
    assert.equal(new Set(ids).size, 10);
    assert.deepEqual(
      ids,
      Array.from({ length: 10 }, (_, i) => i + 1)
    );
  });

  // Test 4: Verify 100 tasks exist.
  await t.test("Server stores and retrieves 100 tasks", async () => {
    await createHunt("HUNDRED", 100);

    const response = await getTasks("HUNDRED");
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.tasks.length, 100);

    const ids = data.tasks.map(task => task.id);
    assert.equal(new Set(ids).size, 100);
    assert.deepEqual(
      ids,
      Array.from({ length: 100 }, (_, i) => i + 1)
    );

    for (const task of data.tasks) {
      assert.equal("answer" in task, false);
    }
  });
});