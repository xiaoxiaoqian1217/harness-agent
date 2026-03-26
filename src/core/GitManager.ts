import simpleGit, { SimpleGit, SimpleGitOptions, CommitResult, StatusResult, LogResult } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export interface GitCommitOptions {
  message: string;
  author?: {
    name: string;
    email: string;
  };
  files?: string[];
}

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  modified: string[];
  created: string[];
  deleted: string[];
  staged: string[];
  conflicted: string[];
  ahead: number;
  behind: number;
}

export class GitManager {
  private git: SimpleGit;
  private repoPath: string;
  private defaultUserName: string;
  private defaultUserEmail: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;

    const options: Partial<SimpleGitOptions> = {
      baseDir: repoPath,
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: false,
    };

    this.git = simpleGit(options);

    this.defaultUserName = process.env.GIT_USER_NAME || 'Harness AI Agent';
    this.defaultUserEmail = process.env.GIT_USER_EMAIL || 'agent@harness.ai';
  }

  /**
   * Initialize a new git repository
   */
  async init(): Promise<void> {
    if (!await fs.pathExists(this.repoPath)) {
      await fs.mkdirp(this.repoPath);
    }

    await this.git.init();

    // Configure user
    await this.git.addConfig('user.name', this.defaultUserName);
    await this.git.addConfig('user.email', this.defaultUserEmail);
  }

  /**
   * Check if the current directory is a git repository
   */
  async isRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current git status
   */
  async getStatus(): Promise<GitStatus> {
    const status: StatusResult = await this.git.status();

    return {
      isRepo: await this.isRepository(),
      branch: status.current || 'master',
      modified: status.modified,
      created: status.created,
      deleted: status.deleted,
      staged: status.staged,
      conflicted: status.conflicted,
      ahead: status.ahead,
      behind: status.behind,
    };
  }

  /**
   * Add files to git staging area
   * @param files Files to add, defaults to all files if not specified
   */
  async add(files?: string[] | string): Promise<void> {
    await this.git.add(files || '.');
  }

  /**
   * Commit changes to git
   */
  async commit(options: GitCommitOptions): Promise<CommitResult> {
    const author = options.author || {
      name: this.defaultUserName,
      email: this.defaultUserEmail,
    };

    const commitOptions = await this.git.commit(
      options.message,
      options.files || [],
      {
        '--author': `"${author.name} <${author.email}>"',
      }
    );

    return commit;
  }

  /**
   * Add all changes and commit
   */
  async addAndCommit(message: string, options?: Omit<GitCommitOptions, 'message'>): Promise<CommitResult> {
    await this.add();
    return this.commit({
      message,
      ...options,
    });
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName: string, checkout: boolean = true): Promise<void> {
    await this.git.branch([branchName]);
    if (checkout) {
      await this.git.checkout(branchName);
    }
  }

  /**
   * Checkout an existing branch or commit
   */
  async checkout(ref: string): Promise<void> {
    await this.git.checkout(ref);
  }

  /**
   * Get commit history
   */
  async getHistory(maxCount?: number): Promise<LogResult> {
    return this.git.log({
      maxCount: maxCount || 20,
    });
  }

  /**
   * Get the current commit hash
   */
  async getCurrentCommitHash(): Promise<string> {
    return this.git.revparse(['HEAD']);
  }

  /**
   * Check if there are uncommitted changes
   */
  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.getStatus();
    return (
      status.modified.length > 0 ||
      status.created.length > 0 ||
      status.deleted.length > 0 ||
      status.conflicted.length > 0
    );
  }

  /**
   * Create a snapshot of the current state
   * @param snapshotName Name of the snapshot
   */
  async createSnapshot(snapshotName: string): Promise<string> {
    const branchName = `snapshot/${snapshotName}/${Date.now()}`;
    await this.createBranch(branchName, false);
    return branchName;
  }

  /**
   * Restore to a previous snapshot or commit
   * @param ref Branch name or commit hash
   * @param hard Whether to do a hard reset
   */
  async restore(ref: string, hard: boolean = false): Promise<void> {
    if (hard) {
      await this.git.reset(['--hard', ref);
    } else {
      await this.git.checkout(ref);
    }
  }

  /**
   * Get the repository path
   */
  getRepoPath(): string {
    return this.repoPath;
  }
}
