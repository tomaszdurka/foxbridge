import {Run, Session, Workspace} from "../../database/entities";

export type RunOptions = {
    run: Run;
    session: Session;
    workspace: Workspace
    onOutput?: (line: unknown) => void;
}

export type RunResult = {
    result: string;
    structuredResult?: any
}