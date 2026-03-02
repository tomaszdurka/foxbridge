import {RunOptions} from "../claude/claude.service";

export const enhancePrompt = ({prompt, runId}: RunOptions) => `${prompt}

IMPORTANT: Never read/create/modify files outside of this directory. Current directory is your workspace and build everything here.

IMPORTANT: After completing the task, update the AGENTS.md file in the workspace with:
- Current state of the project
- Any important context for future runs
- Include technical details and tooling if applicable
- Include information about any people, teams, companies involved if applicable

IMPORTANT: Also maintain the workspace specification in the single SPECIFICATION.md file
- Try to include every feature on mid-high level
- Update this file with current state

IMPORTANT: On every run also create new entry at the beginning of CHANGELOG.md
- Each entry should have title with date+time and run-id '${runId}'
- Below in bullets write down any change e.g. executed tasks, implemented/modified/removed features, etc.

This helps maintain continuity across multiple runs in the same workspace.`