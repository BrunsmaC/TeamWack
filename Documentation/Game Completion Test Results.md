# Game completion modal test results

## Updated modal requirements — October 27, 2026

The close button and all modal, medal, and home-button shadows have been removed. Escape keeps the modal open so users return home to choose another hunt. The modal uses its content height without internal scrolling, with reduced spacing for short viewports.

Run: `npm run test:completion`. Observed results: **4 passed, 0 failed**.

| Test | Result |
| --- | --- |
| Incorrect answers and partial completion do not open the modal. | PASS |
| Final task opens the themed modal with the game name and working home navigation. | PASS |
| No close button; Escape preserves the modal; modal, medal, and home button have no shadows. | PASS |
| At 375 x 667, the modal fits the viewport, has no internal overflow, and the home link is visible. | PASS |

Targeted lint and whitespace checks passed. The runner again stalled during development-server teardown after reporting the passing cases; clean process exit was not verified.

The following results describe the earlier version, before dismissal was removed.

## Original test report

Test date: October 27, 2026

Automated browser tests: `tests/game-completion.spec.js`.
Environment: Windows, headless Google Chrome, Playwright 1.64.1, Node 24.21.0, Vite development server with React Strict Mode enabled.

## How to run

From the repository root, run `npm install`, then `npm run test:completion`.
Google Chrome must be installed (the configuration uses `channel: 'chrome'`).
The runner starts the site on port 4173, or reuses a running development server on that port outside CI.
Each case starts a fresh browser context at `/game?code=BUC123`.

To complete the sample hunt, submit `1` for The Clockkeeper, `rose` for Hidden Garden Gate, and `community` for Market Motto.

## Cases and observed results

| ID | Steps | Expected result | Initial run | Final run |
| --- | --- | --- | --- | --- |
| GC-01 | Open the hunt, submit `wrong` for the first task, then correctly complete the first two tasks. | Incorrect answer leaves count at 0; correct answers reach 2/3. Hunt stays active and no modal opens. | PASS | PASS |
| GC-02 | Correctly complete all three tasks. Inspect the dialog, then click Back to home. | Count reaches 3/3 and hunt is marked complete. Visible dialog names Old Town Secrets, reports all three tasks completed, and asks whether to play another game. Cream background, navy text, and yellow home button match the theme. Home link receives focus, background scrolling is locked, and clicking it navigates to `/`. | FAIL: dialog dismissed itself before assertions. | PASS |
| GC-03 | Complete all tasks, then click Close congratulations. | Dialog disappears, all three tasks remain complete, Hunt complete status remains, and background scrolling is restored. | FAIL: dialog dismissed itself before assertions. | PASS |
| GC-04 | Complete all tasks, then press Escape. | Dialog disappears while completion status and all three completed tasks remain; scrolling is restored. | FAIL: dialog dismissed itself before assertions. | PASS |
| GC-05 | Set viewport to 375 x 667 and complete all tasks. | Dialog stays within viewport bounds and Back to home is visible in the viewport. | FAIL: dialog dismissed itself before assertions. | PASS |

Final browser assertions: **5 passed, 0 failed**.

Runner note: after printing all five passing case results, the runner stalled during development-server shutdown in this Windows environment and was interrupted. The cases passed, but a clean runner exit was not verified. Targeted lint and `git diff --check` also passed.

## Defects found and corrected

1. React Strict Mode runs an effect setup/cleanup/setup cycle. Cleanup called `dialog.close()`, whose queued close event dismissed the reopened modal. The close handler now ignores that event when the dialog is open again. Initial results were 1 pass and 4 failures.
2. After correcting the dismissal bug, GC-02 found that the home link did not receive keyboard focus. The modal now explicitly focuses that link after opening. The intermediate run passed the other four cases.

## Scope and limits

These tests exercise the current sample hunt through the actual page UI. They verify computed theme colors and mobile bounds; they do not replace a visual design review or cover other browsers. Account-level persistence and server task storage are outside this suite because `/game` currently stores sample task progress only in React state.
