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


## Game map

The game uses Leaflet with OpenStreetMap tiles. Select **Enable location** and allow
browser location access to show a live blue marker and GPS accuracy circle.
Use HTTPS (or localhost) for geolocation. **Find me** resumes following the player;
**Show tasks** fits all stops; **Stop tracking** ends the location watch.

Hunt CSV columns `location,latitude,longitude` define the landmark name and coordinates.
The API returns them as `location: { name, latitude, longitude }`; missing or invalid
coordinates return `null` and are not plotted. Task numbers match the list even when
completed tasks move to the bottom. Green markers identify completed tasks.
The BUC123 coordinates are the supplied ETSU/Founders Park locations. Clue answers
are existing prototype answers and should be verified against the real landmarks.
Location stays in the browser; it is not sent to the task API. Map tiles need internet.

Run `npx playwright install chromium` once before `npm run test:completion`.
