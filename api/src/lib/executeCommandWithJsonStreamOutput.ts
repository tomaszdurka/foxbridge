import {spawn} from "child_process";

export async function executeCommandWithJsonStreamOutput(options: {
    command: string;
    args: string[];
    cwd: string;
    env?: NodeJS.ProcessEnv;
    onLine?: (parsed: any) => void;
}): Promise<number | null> {
    return new Promise((resolve, reject) => {
        const child = spawn(options.command, options.args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: options.cwd,
            env: options.env || process.env,
        });

        let stdoutBuffer = '';
        let stderrBuffer = '';

        const handleOutput = (data: string, buffer: string) => {
            console.debug(data)
            buffer += data;
            const lines = buffer.split('\n');
            const remaining = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const event = JSON.parse(line);
                        options.onLine?.(event);
                    } catch (err) {
                        console.error(`Failed to parse JSON: ${line}`);
                    }
                }
            }

            return remaining;
        };

        child.on('error', (err) => {
            reject(new Error(`Failed to spawn ${options.command}: ${err.message}`));
        });

        child.stdout?.on('data', (chunk: Buffer) => {
            stdoutBuffer = handleOutput(chunk.toString(), stdoutBuffer);
        });

        child.stderr?.on('data', (chunk: Buffer) => {
            stderrBuffer = handleOutput(chunk.toString(), stderrBuffer);
        });

        child.on('close', (code) => {
            resolve(code);
        });

        child.stdin?.end();
    });
}