import { useMemo, useState } from "react";
import "./TaskPanel.css";

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const X = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

function TaskItem({ task, number, onSubmit }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await onSubmit(task.id, text);
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <article className={`task-item ${task.done ? "is-complete" : ""}`}>
      <div className="task-status" aria-label={task.done ? "Completed" : "Incomplete"}>
        {task.done ? <Check /> : number}
      </div>

      <div className="task-body">
        <div className="task-title-row">
          <h3>{task.title}</h3>
          <span className={task.done ? "status-complete" : "status-open"}>
            {task.done ? "Complete" : "Open"}
          </span>
        </div>

        {task.description && <p>{task.description}</p>}

        {task.done ? (
          <p className="task-answer">
            <span>Your answer</span>
            {task.submittedText}
          </p>
        ) : (
          <form className="answer-form" onSubmit={submit}>
            <label htmlFor={`tp-in-${task.id}`}>Your answer</label>
            <div className="answer-row">
              <input id={`tp-in-${task.id}`} type="text" value={text} maxLength={500}
                autoComplete="off" placeholder="Type what you found"
                onChange={(e) => setText(e.target.value)} />
              <button type="submit" disabled={busy || !text.trim()}>
                {busy ? "Checking…" : "Complete"}
              </button>
            </div>
            {error && (
              <p className="task-message" role="alert"><X />{error}</p>
            )}
          </form>
        )}
      </div>
    </article>
  );
}

/**
 * <TaskPanel {...useTasks(gameCode)} />
 *
 * Inline task list (no dropdown / slide-out). The tasks state comes from
 * useTasks, which now lives in Game so the progress box, map and completion
 * modal can read it too.
 */
export default function TaskPanel({ tasks, loading, error, refresh, complete }) {
  const [unfinishedFirst, setUnfinishedFirst] = useState(true);

  const { sorted, numbers } = useMemo(() => {
    const list = [...tasks].sort((a, b) => a.id - b.id);
    const numbers = new Map(list.map((t, i) => [t.id, i + 1]));
    return {
      sorted: unfinishedFirst ? list.sort((a, b) => Number(a.done) - Number(b.done)) : list,
      numbers,
    };
  }, [tasks, unfinishedFirst]);

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <section className="task-panel" aria-labelledby="task-list-title">
      <div className="task-heading">
        <h2 id="task-list-title">Tasks</h2>
        <span>{doneCount}/{tasks.length} complete</span>
      </div>

      <label className="task-sort">
        <input type="checkbox" checked={unfinishedFirst}
          onChange={(e) => setUnfinishedFirst(e.target.checked)} />
        Unfinished first
      </label>

      {loading && <p className="task-empty">Loading tasks…</p>}
      {!loading && error && (
        <div className="task-empty">
          <p className="task-message" role="alert"><X />{error}</p>
          <button type="button" className="task-retry" onClick={refresh}>Try again</button>
        </div>
      )}
      {!loading && !error && tasks.length === 0 && (
        <p className="task-empty">No tasks have been added to this hunt yet.</p>
      )}

      <div className="task-list">
        {sorted.map((t) => (
          <TaskItem key={t.id} task={t} number={numbers.get(t.id)} onSubmit={complete} />
        ))}
      </div>
    </section>
  );
}
