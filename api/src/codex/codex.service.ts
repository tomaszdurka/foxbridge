import {Injectable, Logger} from '@nestjs/common';
import path from "node:path";
import * as fs from "node:fs";
import {executeCommandWithJsonStreamOutput} from "../lib/executeCommandWithJsonStreamOutput";
import {RunOptions, RunResult} from "../runs/dto/run-options";
import {execSync} from "node:child_process";
import {readFileSync} from "fs";
import {Session} from "../database/entities";


@Injectable()
export class CodexService {
    private readonly logger = new Logger(CodexService.name);

    async run(options: RunOptions): Promise<RunResult> {
        const {run, session, workspace} = options;
        const {runId, prompt, outputSchema} = run;

        // Create initial AGENTS.md file
        const agentsMdPath = path.join(workspace.workingDir, 'AGENTS.md');
        const initialContent = `
Please refer to:
- SPECIFICATION.md for expected specification 
- CHANGELOG.md for changelog`;
        if (!fs.existsSync(agentsMdPath)) {
            fs.writeFileSync(agentsMdPath, initialContent);
        }

        // Ensure run directory exist
        const runPath = path.join(this.getSessionDirectory(session), runId);
        fs.mkdirSync(runPath, {recursive: true});


        // Check for existing codex session
        const codexSessionId = this.retrieveCodexSessionId(session);
        const sessionMarker = codexSessionId ? '' : `[SESSION-ID=${session.sessionId}]\n`
        const enhancedPrompt = `${sessionMarker}${prompt}`

        const args = [
            'exec',
        ]
        if (codexSessionId) {
            args.push(
                'resume',
                codexSessionId,
            )
        }

        args.push(
            enhancedPrompt,
            '--full-auto',
            '--json',
            '--skip-git-repo-check',
            '--output-last-message',
            path.join(runPath, 'output'),
        );


        // Add schema if provided
        if (outputSchema) {
            const outputSchemaPath = path.join(runPath, 'output-schema.json');
            fs.writeFileSync(outputSchemaPath, JSON.stringify(outputSchema));
            args.push('--output-schema', outputSchemaPath);
        }

        // Strip environment variables to avoid nesting issues
        const env = {...process.env};

        await executeCommandWithJsonStreamOutput({
            command: 'codex',
            args,
            cwd: workspace.workingDir,
            env,
            onLine: (event: any) => {
                options.onOutput?.(event);
            },
        });

        const result = fs.readFileSync(path.join(runPath, 'output')).toString()
        return {
            result,
            ...outputSchema && {structuredOutput: JSON.parse(result)},
        }
    }

    retrieveCodexSessionId(session: Session) {
        const sessionPath = this.getSessionDirectory(session);

        // Find codex session id, but searching for special file
        const codexSessionPath = path.join(sessionPath, 'session-id');
        if (fs.existsSync(codexSessionPath)) {
            return readFileSync(codexSessionPath).toString()
        }

        // Find codex session id, but searching for special session-marker
        try {
            const cmd = `find ~/.codex/sessions -name "*.jsonl" -exec grep -lF "[SESSION-ID=${session.sessionId}]" {} + 2>/dev/null | sed -E 's/.*-([a-f0-9-]{36})\\.jsonl/\\1/'`;
            const codexSessionId = execSync(cmd, {encoding: 'utf8'}).split("\n")[0];
            if (!!codexSessionId) {
                fs.writeFileSync(codexSessionPath, codexSessionId);
                return codexSessionId;
            }
        } catch (e) {
        }
        return null;
    }

    getSessionDirectory(session: Session) {
        const sessionPath = path.join(session.workspace.workingDir, '.codex', session.sessionId);
        fs.mkdirSync(sessionPath, {recursive: true});
        return sessionPath;
    }
}
