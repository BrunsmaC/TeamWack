
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

async function getFreePort() {
  const socket = net.createServer();

  await new Promise(resolve =>
    socket.listen(0, "127.0.0.1", resolve)
  );

  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));

  return port;
}

test("Sprint 5 - Answer Submission Tests", async (t) => {
  // Create an isolated directory for test data.
  const dataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "buchunt-answers-")
  );

  const port = await getFreePort();
  const phone = "4235551234";
  const baseUrl = `http://127.0.0.1:${port}`;

  // Start the BucHunt backend.
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

  // Stop server and remove temporary data.
  t.after(async () => {
    server.kill();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  // Create a hunt containing one task.
  async function createHunt(code) {
    const folder = path.join(dataDir, "hunts", code);

    await fs.mkdir(folder, { recursive: true });

    const csv =
      "id,title,description,answer\n" +
      "1,Test Task,Submit the correct answer,apple\n";

    await fs.writeFile(
      path.join(folder, "tasks.csv"),
      csv
    );
  }

  // Submit a player's answer.
  async function submitAnswer(code, answer) {
    return fetch(
      `${baseUrl}/api/hunts/${code}/tasks/1/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-phone": phone
        },
        body: JSON.stringify({ text: answer })
      }
    );
  }

  // Retrieve the player's task completion status.
  async function getTasks(code) {
    return fetch(
      `${baseUrl}/api/hunts/${code}/tasks`,
      {
        headers: { "x-user-phone": phone }
      }
    );
  }

  // Wait for the backend to become available.
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

  // TEST 1: Correct answers should be accepted.
  await t.test("Correct answer completes task", async () => {
    await createHunt("CORRECT");

    const response = await submitAnswer("CORRECT", "apple");
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.task.id, 1);
    assert.equal(data.task.done, true);
    assert.equal(data.task.submittedText, "apple");
    assert.ok(data.task.completedAt > 0);

    // Verify completion was saved.
    const tasksResponse = await getTasks("CORRECT");
    const tasksData = await tasksResponse.json();

    assert.equal(tasksResponse.status, 200);
    assert.equal(tasksData.tasks[0].done, true);
  });

  // TEST 2: Incorrect answers should be rejected.
  await t.test("Incorrect answer does not complete task", async () => {
    await createHunt("INCORRECT");

    const response = await submitAnswer("INCORRECT", "orange");
    const data = await response.json();

    assert.equal(response.status, 422);
    assert.equal(data.error, "Not the right answer. Try again.");

    // Verify the task is still incomplete.
    const tasksResponse = await getTasks("INCORRECT");
    const tasksData = await tasksResponse.json();

    assert.equal(tasksResponse.status, 200);
    assert.equal(tasksData.tasks[0].done, false);
    assert.equal(tasksData.tasks[0].completedAt, null);
    assert.equal(tasksData.tasks[0].submittedText, null);
  });
});