import { useEffect, useMemo, useState } from "react";
import useTasks from "./useTasks.js";
import "./TaskPanel.css";

const Check = ({ done }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {done ? (
      <>
        <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
        <path d="M8 12.5l3 3 5-6" stroke="#f5c84c" />
      </>
    ) : (
      <circle cx="12" cy="12" r="9" />
    )}
  </svg>
);

const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6h11M9 12h11M9 18h11M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17" />
  </svg>
);

function TaskItem({ task, expanded, onToggle, onSubmit }) {
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
    <li className={`tp-item ${task.done ? "is-done" : ""}`}>
      <button type="button" className="tp-item-head" aria-expanded={expanded} onClick={onToggle}>
        <Check done={task.done} />
        <span className="tp-item-title">{task.title}</span>
        <span className="tp-item-status">{task.done ? "Done" : "To do"}</span>
      </button>

      {expanded && (
        <div className="tp-item-body">
          {task.description && <p className="tp-desc">{task.description}</p>}
          {task.done ? (
            <p className="tp-answer">
              <span>Your answer</span>
              {task.submittedText}
            </p>
          ) : (
            <form onSubmit={submit}>
              <label htmlFor={`tp-in-${task.id}`}>Your answer</label>
              <div className="tp-row">
                <input id={`tp-in-${task.id}`} type="text" value={text} maxLength={500}
                  autoComplete="off" onChange={(e) => setText(e.target.value)} />
                <button type="submit" disabled={busy || !text.trim()}>
                  {busy ? "Checking…" : "Complete"}
                </button>
              </div>
              {error && <p className="tp-error" role="alert">{error}</p>}
            </form>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * <TaskPanel gameCode="DEMO" />
 *
 * Drop it anywhere on the game page (e.g. in the header).
 *  - Mobile (<900px): a button that opens a dropdown right below it.
 *  - Desktop: a tab on the right edge that slides out the full list.
 * The user comes from the login session, so only the game code is needed.
 */
export default function TaskPanel({ gameCode }) {
  const { tasks, loading, error, refresh, complete } = useTasks(gameCode);
  const [open, setOpen] = useState(false);
  const [unfinishedFirst, setUnfinishedFirst] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sorted = useMemo(() => {
    const list = [...tasks].sort((a, b) => a.id - b.id);
    return unfinishedFirst ? list.sort((a, b) => Number(a.done) - Number(b.done)) : list;
  }, [tasks, unfinishedFirst]);

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className={`tp ${open ? "is-open" : ""}`}>
      <button type="button" className="tp-toggle" aria-expanded={open}
        aria-controls="tp-panel" onClick={() => setOpen((o) => !o)}>
        <ListIcon />
        <span className="tp-toggle-label">Tasks</span>
        {tasks.length > 0 && <span className="tp-count">{doneCount}/{tasks.length}</span>}
      </button>

      <section id="tp-panel" className="tp-panel" aria-label="Hunt tasks">
        <header className="tp-head">
          <h2>Hunt tasks</h2>
          <button type="button" className="tp-close" aria-label="Close tasks" onClick={() => setOpen(false)}>×</button>
        </header>

        <div className="tp-bar" aria-hidden="true">
          <span style={{ width: tasks.length ? `${(doneCount / tasks.length) * 100}%` : 0 }} />
        </div>

        <label className="tp-sort">
          <input type="checkbox" checked={unfinishedFirst}
            onChange={(e) => setUnfinishedFirst(e.target.checked)} />
          Unfinished first
        </label>

        {loading && <p className="tp-msg">Loading tasks…</p>}
        {!loading && error && (
          <p className="tp-msg tp-error" role="alert">
            {error} <button type="button" onClick={refresh}>Try again</button>
          </p>
        )}
        {!loading && !error && tasks.length === 0 && (
          <p className="tp-msg">No tasks have been added to this hunt yet.</p>
        )}

        <ul className="tp-list">
          {sorted.map((t) => (
            <TaskItem key={t.id} task={t} expanded={expandedId === t.id}
              onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
              onSubmit={complete} />
          ))}
        </ul>
      </section>
    </div>
  );
}
