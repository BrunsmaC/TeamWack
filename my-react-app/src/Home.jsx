import { useState } from "react";
import "./Home.css";

/* ---------- small icons ---------- */
const Arrow = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const Pin = ({ x, y, fill, stroke, children }) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M0 0 C-20 -18 -32 -28 -32 -40 a32 32 0 1 1 64 0 C32 -28 20 -18 0 0Z"
      fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round"
    />
    <g transform="translate(0 -40)" fill="none" stroke={stroke === "#16244a" && fill === "#16244a" ? "#fff" : "#16244a"}
       strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  </g>
);

/* ---------- the tilted map ---------- */
function MapIllustration() {
  const navy = "#16244a";
  const yellow = "#f5c84c";
  return (
    <div className="map-stage" aria-hidden="true">
      <div className="map-sun" />
      <div className="map-sheet">
        <svg viewBox="0 0 660 700" className="map-svg">
          <defs>
            <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M64 0H0V64" fill="none" stroke="#d8cdaa" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="660" height="700" fill="#efe7d0" />
          <rect width="660" height="700" fill="url(#grid)" />

          {/* roads: cream casing, navy centre */}
          {[
            "M160 0 L420 700",
            "M-10 395 L665 30",
            "M-10 520 L640 690",
          ].map((d) => (
            <g key={d} fill="none">
              <path d={d} stroke="#fffaf1" strokeWidth="44" />
              <path d={d} stroke={navy} strokeWidth="22" />
            </g>
          ))}

          {/* route */}
          <path
            d="M125 560 C190 530 215 470 195 400 C175 340 150 330 195 250 C225 195 270 195 300 205"
            fill="none" stroke={yellow} strokeWidth="6" strokeLinecap="round" strokeDasharray="4 18"
          />
          <path d="M470 160 C455 150 470 140 480 140" fill="none" stroke={yellow}
            strokeWidth="6" strokeLinecap="round" strokeDasharray="4 14" />

          {/* district labels */}
          <g fontFamily="Space Grotesk, sans-serif" fontWeight="700" fill={navy} letterSpacing="3.5">
            <text x="285" y="318" fontSize="17">MARKET</text>
            <text x="285" y="342" fontSize="17">SQUARE</text>
            <text x="500" y="482" fontSize="17">OLD TOWN</text>
            <text x="72" y="672" fontSize="14">START</text>
          </g>

          {/* hidden garden card */}
          <g transform="rotate(3 537 236)">
            <rect x="445" y="168" width="185" height="135" fill={yellow} stroke={navy} strokeWidth="2" />
            {[490, 537, 584].map((cx) => (
              <ellipse key={cx} cx={cx} cy="230" rx="14" ry="22" fill={navy} />
            ))}
            <text x="537" y="285" textAnchor="middle" fontSize="12" fontWeight="700"
              fontFamily="Space Grotesk, sans-serif" letterSpacing="1.5" fill={navy}>HIDDEN GARDEN</text>
          </g>

          {/* pins */}
          <Pin x="485" y="155" fill={navy} stroke={navy}>
            <rect x="-13" y="-8" width="26" height="19" rx="3" />
            <circle cx="0" cy="2" r="5" />
          </Pin>
          <Pin x="125" y="598" fill={yellow} stroke={navy}>
            <path d="M-8 -12V13M-8 -12H10L5 -5L10 2H-8" />
          </Pin>
          <Pin x="522" y="631" fill={yellow} stroke={navy}>
            <circle cx="0" cy="0" r="10" />
            <circle cx="0" cy="0" r="3" />
          </Pin>
        </svg>
      </div>

      <p className="map-note">
        X marks
        <br />
        the spot!
        <svg width="34" height="26" viewBox="0 0 34 26" fill="none" stroke="currentColor"
          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 2C22 8 14 14 6 20M6 20l9-1M6 20l2-9" />
        </svg>
      </p>

      <div className="clue-card">
        <span className="clue-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16244a"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
        </span>
        <div>
          <p className="clue-label">Next clue</p>
          <p className="clue-title">The Clockkeeper</p>
          <p className="clue-dist">0.4 km away</p>
        </div>
        <Arrow size={22} />
      </div>
    </div>
  );
}

/* ---------- page ---------- */
/**
 * Props
 *  - explorersThisWeek: number | undefined  → fills the "joined this week" spot (hidden when undefined)
 *  - onStart({ phone, gameCode }): called on submit — wire this to your router / API
 */
export default function Home({ explorersThisWeek, onStart }) {
  const [phone, setPhone] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = gameCode.trim();
    if (!code) {
      setError("Enter a game code to join.");
      return;
    }

    setIsJoining(true);
    setError("");
    try {
      await onStart?.({ phone: phone.trim(), gameCode: code });
    } catch (joinError) {
      setError(joinError.message || "Unable to join that hunt.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="bh">
      <header className="bh-header">
        <div className="bh-container bh-header-row">
          <a href="/" className="bh-brand" aria-label="Buchunt home">
            <span className="bh-logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M15.5 8.5l-2 5-5 2 2-5z" />
              </svg>
            </span>
            Buchunt
          </a>
          <a href="#hunt-form" className="btn btn-sm btn-onnavy bh-join">
            Join the hunt <Arrow size={18} />
          </a>
          <button
            type="button"
            className="bh-menu-btn"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <nav className="bh-menu" aria-label="Main">
            <div className="bh-container">
              <a href="#hunt-form" className="btn btn-sm btn-onnavy" onClick={() => setMenuOpen(false)}>
                Join the hunt <Arrow size={18} />
              </a>
            </div>
          </nav>
        )}
      </header>

      <main className="bh-container bh-hero">
        <div className="bh-copy">
          <p className="bh-eyebrow">
            <span className="bh-spark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16244a"
                strokeWidth="2" strokeLinejoin="round">
                <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" />
              </svg>
            </span>
            The original Buchunt
          </p>

          <h1 className="bh-title">
            The hunt is
            <span className="bh-on">on.</span>
          </h1>

          <p className="bh-lede">
            Gather your crew, solve clever clues, and uncover the stories hiding in plain sight.
            Adventure is closer than you think.
          </p>

          <form id="hunt-form" className="bh-form" onSubmit={handleSubmit}>
            <label htmlFor="phone">Phone number</label>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel"
              placeholder="Optional for saving progress" value={phone}
              onChange={(e) => setPhone(e.target.value)} />

            <label htmlFor="code">Game code</label>
            <input id="code" type="text" autoComplete="off" autoCapitalize="characters"
              placeholder="Enter your game code" value={gameCode}
              onChange={(e) => setGameCode(e.target.value)} />
            {error && <p className="bh-error" role="alert">{error}</p>}

            <div className="bh-actions">
              <button type="submit" className="btn btn-lg btn-onlight" disabled={isJoining}>
                {isJoining ? "Joining Hunt" : "Start Hunt"} <Arrow />
              </button>

              {/* spot for the "explorers joined this week" count */}
              {explorersThisWeek != null && (
                <div className="bh-proof">
                  <span className="bh-avatars" aria-hidden="true">
                    <span>MK</span><span>JL</span><span>AS</span>
                  </span>
                  <p>
                    <strong>{explorersThisWeek.toLocaleString()}</strong>
                    <span>explorers joined this week</span>
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        <MapIllustration />
      </main>

      <footer className="bh-container bh-foot">
        <span>One city · Countless secrets</span>
        <span>This Saturday 10am–6pm · Downtown</span>
      </footer>
    </div>
  );
}
