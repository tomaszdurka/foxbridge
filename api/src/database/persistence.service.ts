import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { RunStatus, Workspace, Session, Run, RunEvent } from './entities';
import { v4 as uuidv4 } from 'uuid';
import * as fs from "node:fs";

@Injectable()
export class PersistenceService {
  private readonly logger = new Logger(PersistenceService.name);

  constructor(private readonly em: EntityManager) {}

  /**
   * Store an event for a run
   */
  async storeEvent(payload: {
    runId: string;
    event: any;
    sequence: number;
  }): Promise<void> {
    try {
      const event = this.em.create(RunEvent, {
        id: `${payload.runId}-${payload.sequence}`,
        run: { runId: payload.runId } as any,
        type: payload.event.type || 'unknown',
        payload: payload.event,
        sequence: payload.sequence,
      });
      this.em.persist(event);
      await this.em.flush();
    } catch (error) {
      this.logger.error(`Failed to store event for run ${payload.runId}:`, error);
    }
  }

  /**
   * Set the status of a run
   */
  async setStatus(payload: {
    runId: string;
    status: RunStatus;
    result?: object;
    exitCode?: number;
  }): Promise<void> {
    try {
      const run = await this.em.findOneOrFail(Run, { runId: payload.runId });
      run.status = payload.status;
      run.result = payload.result;
      run.exitCode = payload.exitCode;
      run.completedAt = new Date();
      await this.em.flush();
    } catch (error) {
      this.logger.error(`Failed to set status for run ${payload.runId}:`, error);
    }
  }

  /**
   * Create a session
   */
  async createSession(payload: {
    workspaceId: string;
  }): Promise<Session> {
    const sessionId = uuidv4();
    const session = this.em.create(Session, {
      sessionId,
      workspace: { workspaceId: payload.workspaceId } as any,
    });
    this.em.persist(session);
    await this.em.flush();
    return session;
  }

  /**
   * Get a session
   */
  async getSession(payload: { sessionId: string }): Promise<Session | null> {
    return this.em.findOne(Session, { sessionId: payload.sessionId }, { populate: ['workspace', 'runs'] });
  }

  /**
   * Get all sessions
   */
  async findAllSessions(): Promise<Session[]> {
    return this.em.find(Session, {}, {
      orderBy: { createdAt: 'DESC' },
      populate: ['workspace', 'runs']
    });
  }

  /**
   * Get session with runs
   */
  async findSessionWithRuns(payload: { sessionId: string }): Promise<Session | null> {
    return this.em.findOne(Session, { sessionId: payload.sessionId }, { populate: ['workspace', 'runs'] });
  }

  /**
   * Retrieve a workspace
   */
  async getWorkspace(payload: { workspaceId: string }): Promise<Workspace | null> {
    return this.em.findOne(Workspace, { workspaceId: payload.workspaceId });
  }

  /**
   * Retrieve a run with events
   */
  async getRun(payload: { runId: string }): Promise<Run | null> {
    return this.em.findOne(Run, { runId: payload.runId }, { populate: ['events', 'workspace', 'session'] });
  }

  /**
   * Create a workspace
   */
  async createWorkspace(payload: {
    workspaceId: string;
    workingDir: string;
    name?: string;
  }): Promise<Workspace> {
    const workspace = this.em.create(Workspace, {
      workspaceId: payload.workspaceId,
      workingDir: payload.workingDir,
      name: payload.name,
    });
    fs.mkdirSync(payload.workingDir, { recursive: true });
    this.em.persist(workspace);
    await this.em.flush();
    return workspace;
  }

  /**
   * Create a run
   */
  async createRun(payload: {
    prompt: string;
    sessionId: string;
    workspaceId: string;
    outputSchema?: object;
  }): Promise<Run> {
    const runId = uuidv4();
    const run = this.em.create(Run, {
      runId,
      prompt: payload.prompt,
      session: { sessionId: payload.sessionId } as any,
      workspace: { workspaceId: payload.workspaceId } as any,
      outputSchema: payload.outputSchema,
      status: RunStatus.RUNNING,
    });
    this.em.persist(run);
    await this.em.flush();
    return run;
  }

  /**
   * Get all workspaces
   */
  async findAllWorkspaces(): Promise<Workspace[]> {
    return this.em.find(Workspace, {}, { orderBy: { createdAt: 'DESC' } });
  }

  /**
   * Get workspace with runs
   */
  async findWorkspace(payload: { workspaceId: string }): Promise<Workspace | null> {
    return this.em.findOne(Workspace, { workspaceId: payload.workspaceId });
  }

  /**
   * Get workspace with runs
   */
  async findWorkspaceWithRuns(payload: { id: string }): Promise<Workspace | null> {
    return this.em.findOne(Workspace, { workspaceId: payload.id }, { populate: ['runs', 'runs.session'] });
  }

  /**
   * Get all runs
   */
  async findAllRuns(): Promise<Run[]> {
    return this.em.find(Run, {}, {
      orderBy: { startedAt: 'DESC' },
      populate: ['workspace']
    });
  }

  /**
   * Get run with events
   */
  async findRunWithEvents(payload: { runId: string }): Promise<Run | null> {
    return this.em.findOne(Run, { runId: payload.runId }, { populate: ['events', 'workspace', 'session'] });
  }

  /**
   * Update a workspace
   */
  async updateWorkspace(payload: {
    workspaceId: string;
    name?: string | null;
  }): Promise<Workspace | null> {
    const workspace = await this.em.findOne(Workspace, { workspaceId: payload.workspaceId });
    if (!workspace) return null;

    if (payload.name !== undefined) {
      workspace.name = payload.name;
    }

    await this.em.flush();
    return workspace;
  }

  /**
   * Stop all running runs (called on service startup/shutdown)
   */
  async stopAllRunningRuns(): Promise<number> {
    try {
      const runningRuns = await this.em.find(Run, { status: RunStatus.RUNNING });

      if (runningRuns.length === 0) {
        return 0;
      }

      for (const run of runningRuns) {
        run.status = RunStatus.STOPPED;
        run.completedAt = new Date();
      }

      await this.em.flush();
      this.logger.log(`Stopped ${runningRuns.length} running run(s)`);
      return runningRuns.length;
    } catch (error) {
      this.logger.error('Failed to stop running runs:', error);
      return 0;
    }
  }
}
