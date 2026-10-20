# Buchunt Task List: Setup Guide

The task list has two parts that run separately:

1. **The React piece** (`src/tasks/`): the button and panel players see. It runs inside the normal app.
2. **The task server** (`server/`): a small Node program that stores tasks and progress in CSV files. It runs on its own, next to the app.

The server is a second, separate Node project with its own `package.json` and its own `npm install`. It is not bundled with the React app.

---

## 1. Where the files go

```
your-project/
├── index.html
├── vite.config.js          <- edit (step 3)
├── package.json
├── src/
│   ├── App.jsx
│   ├── Home.jsx
│   └── tasks/              <- ADD this folder
│       ├── TaskPanel.jsx
│       ├── TaskPanel.css
│       ├── useTasks.js
│       └── api.js
└── server/                 <- ADD this folder (sibling of src, not inside it)
    ├── index.js
    ├── package.json
    └── data/
        └── hunts/
            └── DEMO/
                └── tasks.csv
```

---

## 2. Install and run the server (second Node project)

The server needs its own install, separate from the main app:

```bash
cd server
npm install
npm start
```

You should see: `Buchunt API on :3001`. Leave this terminal running.

---

## 3. Connect the React app to the server

Open `vite.config.js` in the project root and add the `server` block:

```js
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
```

This forwards any `/api/...` request from the React app to the task server during development. Vite only reads this file at startup, so restart `npm run dev` after saving.

---

## 4. Run both at the same time

Two terminals, both running while you work:

| Terminal | Folder | Command | What it runs |
|---|---|---|---|
| 1 | project root | `npm run dev` | the React app |
| 2 | `server/` | `npm start` | the task server |

If the task list shows an error, check that terminal 2 is running.

---

## 5. Add the task list to the game page

At the top of the game page file:

```jsx
import TaskPanel from "./tasks/TaskPanel.jsx";
```

(Use `../tasks/TaskPanel.jsx` if the game page is in a subfolder like `src/pages/`.)

Inside the page's `return`, where the button should appear (the header works well):

```jsx
<TaskPanel gameCode={gameCode} />
```

- **Mobile:** a "Tasks" button opens a dropdown directly below it.
- **Desktop (900px and wider):** a "Tasks" tab on the right edge slides out a side panel.
- `gameCode` is the code the player entered on the home page.

---

## 6. Temporary testing step (no login yet)

There is no login system yet. To test, open `src/tasks/api.js` and add one line inside `headers`:

```js
headers: {
  "Content-Type": "application/json",
  "x-user-phone": "5551234567", // TEMPORARY: remove once real login works
},
```

Use `DEMO` as the game code. Completed tasks save to
`server/data/hunts/DEMO/progress/5551234567.csv`. Change the number to test as a different user.

**Remove this line once real login is connected.** The server ignores this header when `NODE_ENV=production`.

---

## 7. Connecting real login (for whoever builds accounts)

In `server/index.js`, the `requireUser` function is the only place that identifies the user. Replace the header lookup so it sets `req.phone` from the real logged-in session. Nothing else needs to change.

---

## 8. How data is stored

All data is saved on the server in CSV files, separated by hunt:

```
server/data/hunts/<GAMECODE>/tasks.csv              task definitions
server/data/hunts/<GAMECODE>/progress/<phone>.csv   one user's progress
```

**`tasks.csv`** is written once per hunt and never stored per user:

```
id,title,description,answer
1,The Clockkeeper,"Find the clock in Market Square. What time is on its face?",
2,Hidden Garden,"Name the flower on the gate.",rose
```

- `answer` is optional. Leave it blank to accept any text. Fill it in to require a match (case doesn't matter).
- The answer is never sent to the browser.

**`progress/<phone>.csv`** has one short row per completed task, no header:

```
2,1760000000000,rose
```

That means: task 2, completed at this timestamp, with this submitted text. A task with no row is unfinished.

To add a new hunt, create `server/data/hunts/<NEWCODE>/tasks.csv`. The `progress/` folder is created automatically.

Suggested `.gitignore` line so player data stays out of the repo:

```
server/data/hunts/*/progress/
```

---

## 9. Quick server test

With the server running:

```bash
curl -H "x-user-phone: 5551234567" localhost:3001/api/hunts/DEMO/tasks
```

You should get back the four demo tasks as JSON.

---

## 10. Not included

- Login, sign-up, or phone verification
- The game page itself (a teammate is building it)

Until real login exists, anyone can send any phone number, so don't launch with the temporary header in place.
