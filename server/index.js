/**
 * Buchunt task API (CSV-backed).
 *
 * Storage layout (everything is per hunt, so hunts can never mix):
 *
 *   data/hunts/<GAMECODE>/tasks.csv            <- full task definitions (server-only)
 *       id,title,description,answer             (answer optional; never sent to clients)
 *
 *   data/hunts/<GAMECODE>/progress/<phone>.csv <- one tiny row per COMPLETED task, no header
 *       <taskId>,<completedAtUnixMs>,<submittedText>
 *
 * Titles/descriptions are stored once per hunt, never per user. A task with no row
 * in a user's file is simply "unfinished".
 */
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
const MAX_TEXT = 500;

/* ---------- identity ---------- */
// TODO: replace with your team's real session/login middleware.
// It only needs to set req.user = { phone: "<the logged-in user's phone>" }.
function requireUser(req, res, next) {
  const raw =
    req.user?.phone ||
    (process.env.NODE_ENV !== "production" ? req.get("x-user-phone") : null);
  const phone = String(raw || "").replace(/\D/g, "");
  if (phone.length < 7 || phone.length > 15) {
    return res.status(401).json({ error: "Please log in." });
  }
  req.phone = phone;
  next();
}

/* ---------- path safety ---------- */
const cleanCode = (c) =>
  /^[A-Za-z0-9_-]{1,32}$/.test(c || "") ? c.toUpperCase() : null;

const huntDir = (code) => path.join(DATA_DIR, "hunts", code);
const tasksFile = (code) => path.join(huntDir(code), "tasks.csv");
const progressFile = (code, phone) =>
  path.join(huntDir(code), "progress", `${phone}.csv`);

/* ---------- file helpers ---------- */
const locks = new Map(); // one write at a time per file
function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(key, next.catch(() => {}));
  return next;
}

async function readIfExists(file) {
  try {
    return await fs.readFile(file, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

async function loadTasks(code) {
  const text = await readIfExists(tasksFile(code));
  if (text == null) return null;
  return parse(text, { columns: true, skip_empty_lines: true, trim: true }).map(
    (r) => ({
      id: Number(r.id),
      title: r.title,
      description: r.description || "",
      answer: (r.answer || "").trim(),
    })
  );
}

async function loadProgress(code, phone) {
  const text = await readIfExists(progressFile(code, phone));
  const map = new Map();
  if (!text) return map;
  const rows = parse(text, { skip_empty_lines: true, relax_column_count: true });
  for (const [id, at, ...rest] of rows) {
    map.set(Number(id), { completedAt: Number(at), text: rest.join(",") });
  }
  return map;
}

async function saveProgress(code, phone, map) {
  const file = progressFile(code, phone);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const rows = [...map].map(([id, v]) => [id, v.completedAt, v.text]);
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, stringify(rows)); // atomic: write temp, then rename
  await fs.rename(tmp, file);
}

const publicTask = (t, p) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  done: !!p,
  submittedText: p?.text ?? null,
  completedAt: p?.completedAt ?? null,
});

/* ---------- routes ---------- */
const app = express();
app.use(express.json({ limit: "10kb" }));

// All tasks for a hunt + this user's status on each
app.get("/api/hunts/:code/tasks", requireUser, async (req, res, next) => {
  try {
    const code = cleanCode(req.params.code);
    if (!code) return res.status(400).json({ error: "Invalid game code." });
    const tasks = await loadTasks(code);
    if (!tasks) return res.status(404).json({ error: "Hunt not found." });
    const progress = await loadProgress(code, req.phone);
    res.json({ tasks: tasks.map((t) => publicTask(t, progress.get(t.id))) });
  } catch (e) {
    next(e);
  }
});

// Complete a task by submitting text
app.post(
  "/api/hunts/:code/tasks/:id/complete",
  requireUser,
  async (req, res, next) => {
    try {
      const code = cleanCode(req.params.code);
      const id = Number(req.params.id);
      const text = String(req.body?.text ?? "").trim();
      if (!code) return res.status(400).json({ error: "Invalid game code." });
      if (!text) return res.status(400).json({ error: "Enter some text first." });
      if (text.length > MAX_TEXT)
        return res.status(400).json({ error: `Keep it under ${MAX_TEXT} characters.` });

      const tasks = await loadTasks(code);
      if (!tasks) return res.status(404).json({ error: "Hunt not found." });
      const task = tasks.find((t) => t.id === id);
      if (!task) return res.status(404).json({ error: "Task not found." });

      // If the task defines an answer, it must match (case-insensitive).
      if (task.answer && text.toLowerCase() !== task.answer.toLowerCase()) {
        return res.status(422).json({ error: "Not the right answer. Try again." });
      }

      const key = progressFile(code, req.phone);
      const entry = await withLock(key, async () => {
        const progress = await loadProgress(code, req.phone);
        if (!progress.has(id)) {
          progress.set(id, { completedAt: Date.now(), text });
          await saveProgress(code, req.phone, progress);
        }
        return progress.get(id);
      });
      res.json({ task: publicTask(task, entry) });
    } catch (e) {
      next(e);
    }
  }
);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Buchunt API on :${PORT}`));
