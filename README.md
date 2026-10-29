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

