import { useEffect, useRef, useState } from "react";
import { HUNT_CODE, INVALID_CODE_MESSAGE } from "./huntCode.js";
import TaskPanel from "./tasks/TaskPanel.jsx";
import useTasks from "./tasks/useTasks.js";
import "./Game.css";

const Arrow = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// Map stops follow the hunt's tasks (green once done, yellow while open).
function MockMap({ tasks }) {
  const visibleTasks = tasks.length > 0 ? tasks : [
    { id: "empty-1", title: "Start", done: false },
    { id: "empty-2", title: "Next stop", done: false },
  ];

  return (
    <section className="game-map" aria-label="Hunt map">
      <div className="game-map-paper">
        <svg viewBox="0 0 720 520" role="img" aria-label="Mock map with hunt stops">
          <rect width="720" height="520" fill="#f6efe0" />
          <path d="M0 120H720M0 250H720M0 390H720M120 0V520M300 0V520M520 0V520"
            stroke="#d8ceb8" strokeWidth="2" />
          <path d="M70 465C180 390 185 285 300 260C430 232 455 120 640 82"
            fill="none" stroke="#16244a" strokeWidth="26" strokeLinecap="round" />
          <path d="M70 465C180 390 185 285 300 260C430 232 455 120 640 82"
            fill="none" stroke="#f5c84c" strokeWidth="6" strokeLinecap="round" strokeDasharray="12 18" />
          {visibleTasks.slice(0, 5).map((task, index) => {
            const points = [
              [88, 448],
              [235, 318],
              [354, 244],
              [476, 150],
              [632, 86],
            ];
            const [x, y] = points[index];
            return (
              <g key={task.id} transform={`translate(${x} ${y})`}>
                <circle r="25" fill={task.done ? "#2f8f61" : "#f5c84c"} stroke="#16244a" strokeWidth="4" />
                <text y="6" textAnchor="middle" fontSize="18" fontWeight="800" fill="#16244a">
                  {index + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function JoinPanel({ initialCode, onJoin, error, loading }) {
  const [accessCode, setAccessCode] = useState(initialCode);
  const [validationError, setValidationError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const code = accessCode.trim();
    if (!code) {
      setValidationError("Enter an access code to join.");
      return;
    }
    if (code !== HUNT_CODE) {
      setValidationError(INVALID_CODE_MESSAGE);
      return;
    }
    setValidationError("");
    onJoin(code);
  };

  return (
    <section className="game-entry" aria-labelledby="game-entry-title">
      <p className="game-kicker">Join hunt</p>
      <h1 id="game-entry-title">Enter your access code</h1>
      <form className="game-entry-form" onSubmit={submit}>
        <label htmlFor="game-code">Access code</label>
        <div className="game-entry-row">
          <input
            id="game-code"
            value={accessCode}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="BUC123"
            onChange={(event) => setAccessCode(event.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Joining" : "Join"}
            <Arrow />
          </button>
        </div>
        {(validationError || error) && <p className="game-error">{validationError || error}</p>}
      </form>
    </section>
  );
}

function CompletionModal({ huntName, completedCount }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    dialog.querySelector('.completion-home').focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="completion-modal" aria-labelledby="completion-title"
      aria-describedby="completion-description" onCancel={(event) => event.preventDefault()}>
      <div className="completion-medal" aria-hidden="true">★</div>
      <p className="game-kicker">Hunt complete</p>
      <h2 id="completion-title">Congratulations!</h2>
      <p className="completion-hunt">Congratulations for completing <strong>{huntName}</strong>!</p>
      <p className="completion-count">All {completedCount} tasks completed.</p>
      <p id="completion-description">Would you like to play another game?</p>
      <a className="completion-home" href="/" autoFocus>Back to home <Arrow /></a>
    </dialog>
  );
}

export default function Game() {
  const initialCode = new URLSearchParams(window.location.search).get("code") ?? "";
  const [accessCode, setAccessCode] = useState(initialCode);
  const [hunt, setHunt] = useState(initialCode === HUNT_CODE ? { hunt_name: "Old Town Secrets", access_code: initialCode } : null);

  // Task state (server-backed) lives here so the progress box, map and
  // completion modal can all read it. The hook itself is unchanged.
  const taskState = useTasks(hunt?.access_code);
  const { tasks } = taskState;
  const mapTasks = [...tasks].sort((a, b) => a.id - b.id);
  const completedCount = tasks.filter((task) => task.done).length;
  const isComplete = Boolean(hunt) && tasks.length > 0 && completedCount === tasks.length;

  const join = (code) => {
    if (code !== HUNT_CODE) return;
    setAccessCode(code);
    setHunt({ hunt_name: "Old Town Secrets", access_code: code });
    window.history.replaceState({}, "", `/game?code=${encodeURIComponent(code)}`);
  };

  return (
    <div className="game-shell">
      <header className="game-header">
        <a href="/" className="game-brand" aria-label="Buchunt home">
          <span className="game-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M15.5 8.5l-2 5-5 2 2-5z" />
            </svg>
          </span>
          Buchunt
        </a>
        <a href="/" className="game-home-link">Home</a>
      </header>

      {!hunt && (
        <JoinPanel initialCode={accessCode} onJoin={join} />
      )}

      {hunt && (
        <main className="game-main">
          <section className="game-summary">
            <div>
              <p className="game-kicker">{isComplete ? "Hunt complete" : "Active hunt"}</p>
              <h1>{hunt.hunt_name}</h1>
              <p>Code {hunt.access_code}</p>
            </div>
            <div className="game-progress">
              <strong>{completedCount}</strong>
              <span>of {tasks.length} tasks complete</span>
              {isComplete && <span className="game-complete-status" role="status">Hunt complete!</span>}
            </div>
          </section>

          <div className="game-grid">
            <MockMap tasks={mapTasks} />
            <TaskPanel {...taskState} />
          </div>
        </main>
      )}
      {isComplete && (
        <CompletionModal huntName={hunt.hunt_name} completedCount={completedCount} />
      )}
    </div>
  );
}
