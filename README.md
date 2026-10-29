# TeamWack
Repo for Software Engineering 2 Project

## Branch Setup
---
### feature branches:
| Branch | Purpose |
|------|------|
| main | stable builds only |
| sprint# | each sprint will have its own branch, do not merge here until PO clears the dev |
| dev-s# | each sprint will have its own dev branch, merge here when making chages |
| feature/<name> | features, fixes, experiments |

---


### Source Control Strategy
* Vertical Slicing
* Don't carry unfinished work into the next sprint
* Work sequentially
* Work on one task at a time
* Small working changes are better than partially implemented changes

### Working

* commit working changes
* use clear commit messages:
```bash
feat: add enemy animation
fix: prevent null ref on pickup
refactor: cleanup input handling
```

## Getting It in VSCode

1. In GitHub, click the green **Code** button, select **HTTPS**, then copy the link.
2. In VSCode, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the command palette.
3. Type `>Git: Clone` and select **Clone from GitHub**.
4. Paste the link you copied from GitHub and press **Enter**.
5. When prompted, choose a folder in your project directory to clone it into.
## Route API requests to the backend

<<<<<<< HEAD
<<<<<<< HEAD
## Running the app with Docker

Run `docker compose up --build` from the repository root. Open `http://localhost:8081`.
The Nginx API gateway serves the React app and forwards `/api/` requests to the
Express API service. The API is only exposed inside the Compose network; hunt data
and progress are stored in `server/data` on the host. The welcome-page phone
number identifies a player's progress; completed answers are written under
`server/data/hunts/<GAMECODE>/progress/` and are loaded again on that player's next visit.

=======
=======
>>>>>>> 6aab62974f8a2ae12db30a0ca55d0a67e2943468
The React app uses relative `/api/...` URLs. During development, Vite forwards
those requests to the task API at `http://localhost:3001`. In Docker Compose,
nginx forwards `/api/...` requests to the internal `backend` service, while all
other requests continue to serve the React app.

Run the full stack from the project root with:

```bash
docker compose up --build
```

Open the website at `http://localhost:8081`. The API is available through the
same origin under `/api`; its data is kept in the `backend-data` Docker volume.
<<<<<<< HEAD
>>>>>>> origin/sprint4
=======
>>>>>>> 6aab62974f8a2ae12db30a0ca55d0a67e2943468
