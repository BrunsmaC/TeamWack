import { useCallback, useEffect, useState } from "react";
import { fetchTasks, completeTask } from "./api.js";

export default function useTasks(gameCode) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!gameCode) return;
    try {
      const { tasks } = await fetchTasks(gameCode);
      setTasks(tasks);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [gameCode]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  // Returns { ok: true } or { ok: false, error }
  const complete = useCallback(
    async (taskId, text) => {
      try {
        const { task } = await completeTask(gameCode, taskId, text);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },
    [gameCode]
  );

  return { tasks, loading, error, refresh, complete };
}
