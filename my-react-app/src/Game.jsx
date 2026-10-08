import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrCreatePlayerId } from "./player.js";
import { joinHunt, submitTaskAnswer } from "./api.js";
import "./Game.css";

const Arrow = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

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

function MockMap({ tasks }) {
  const visibleTasks = tasks.length > 0 ? tasks : [
    { id: "empty-1", title: "Start", completed: false },
    { id: "empty-2", title: "Next stop", completed: false },
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
                <circle r="25" fill={task.completed ? "#2f8f61" : "#f5c84c"} stroke="#16244a" strokeWidth="4" />
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

function TaskList({ huntId, playerId, tasks, onTasksUpdated }) {
  const [answers, setAnswers] = useState({});
  const [submittingTask, setSubmittingTask] = useState("");
  const [taskMessages, setTaskMessages] = useState({});

  const submitAnswer = async (event, task) => {
    event.preventDefault();
    const answer = answers[task.id]?.trim();
    if (!answer) {
      setTaskMessages((messages) => ({ ...messages, [task.id]: "Enter an answer first." }));
      return;
    }

    setSubmittingTask(task.id);
    setTaskMessages((messages) => ({ ...messages, [task.id]: "" }));
    try {
      const result = await submitTaskAnswer(huntId, task.id, playerId, answer);
      onTasksUpdated(result.tasks);
      setAnswers((current) => ({ ...current, [task.id]: "" }));
      setTaskMessages((messages) => ({ ...messages, [task.id]: result.message }));
    } catch (error) {
      setTaskMessages((messages) => ({ ...messages, [task.id]: error.message }));
    } finally {
      setSubmittingTask("");
    }
  };

  if (tasks.length === 0) {
    return (
      <section className="task-panel">
        <h2>Tasks</h2>
        <p className="task-empty">This hunt does not have tasks yet.</p>
      </section>
    );
  }

  return (
    <section className="task-panel" aria-labelledby="task-list-title">
      <div className="task-heading">
        <h2 id="task-list-title">Tasks</h2>
        <span>{tasks.filter((task) => task.completed).length}/{tasks.length} complete</span>
      </div>
      <div className="task-list">
        {tasks.map((task, index) => (
          <article className={`task-item ${task.completed ? "is-complete" : ""}`} key={task.id}>
            <div className="task-status" aria-label={task.completed ? "Completed" : "Incomplete"}>
              {task.completed ? <Check /> : index + 1}
            </div>
            <div className="task-body">
              <div className="task-title-row">
                <h3>{task.title}</h3>
                <span className={task.completed ? "status-complete" : "status-open"}>
                  {task.completed ? "Complete" : "Open"}
                </span>
              </div>
              <p>{task.description}</p>
              {!task.completed && (
                <form className="answer-form" onSubmit={(event) => submitAnswer(event, task)}>
                  <label htmlFor={`answer-${task.id}`}>Answer</label>
                  <div className="answer-row">
                    <input
                      id={`answer-${task.id}`}
                      value={answers[task.id] ?? ""}
                      placeholder="Type what you found"
                      onChange={(event) => setAnswers((current) => ({ ...current, [task.id]: event.target.value }))}
                    />
                    <button type="submit" disabled={submittingTask === task.id}>
                      {submittingTask === task.id ? "Checking" : "Submit"}
                    </button>
                  </div>
                </form>
              )}
              {taskMessages[task.id] && (
                <p className={`task-message ${taskMessages[task.id] === "Task completed" ? "success" : ""}`}>
                  {taskMessages[task.id] === "Task completed" ? <Check /> : <X />}
                  {taskMessages[task.id]}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Game() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialCode = query.get("code") ?? "";
  const initialPlayer = query.get("player") ?? getOrCreatePlayerId();
  const [accessCode, setAccessCode] = useState(initialCode);
  const [playerId] = useState(initialPlayer);
  const [hunt, setHunt] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const join = useCallback(async (code) => {
    setLoading(true);
    setError("");
    try {
      const result = await joinHunt(code, playerId);
      setHunt(result);
      setTasks(result.tasks);
      setAccessCode(result.access_code);
      window.history.replaceState({}, "", `/game?code=${encodeURIComponent(result.access_code)}&player=${encodeURIComponent(playerId)}`);
    } catch (joinError) {
      setHunt(null);
      setTasks([]);
      setError(joinError.message);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  // oxlint-disable-next-line react-hooks/exhaustive-deps, react/set-state-in-effect
  useEffect(() => {
    if (initialCode) {
      join(initialCode);
    }
  }, [initialCode, join]);

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
        <JoinPanel initialCode={accessCode} onJoin={join} error={error} loading={loading} />
      )}

      {hunt && (
        <main className="game-main">
          <section className="game-summary">
            <div>
              <p className="game-kicker">Active hunt</p>
              <h1>{hunt.hunt_name}</h1>
              <p>Code {hunt.access_code}</p>
            </div>
            <div className="game-progress">
              <strong>{tasks.filter((task) => task.completed).length}</strong>
              <span>of {tasks.length} tasks complete</span>
            </div>
          </section>

          <div className="game-grid">
            <MockMap tasks={tasks} />
            <TaskList
              huntId={hunt.hunt_id}
              playerId={playerId}
              tasks={tasks}
              onTasksUpdated={setTasks}
            />
          </div>
        </main>
      )}
    </div>
  );
}
