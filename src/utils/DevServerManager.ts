import { spawn, ChildProcess } from 'child_process';
import net from 'net';
import path from 'path';
import fs from 'fs-extra';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

export interface DevServerOptions {
  projectPath: string;
  port?: number;
  timeout?: number;
}

export class DevServerManager {
  private serverProcess: ChildProcess | null = null;
  private options: Required<DevServerOptions>;
  private isReady: boolean = false;

  constructor(options: DevServerOptions) {
    this.options = {
      port: options.port || 3000,
      timeout: options.timeout || 120000, // 2 minutes
      projectPath: options.projectPath,
    };
  }

  /**
   * Start the development server
   */
  async start(): Promise<void> {
    logger.info('Starting development server', { projectPath: this.options.projectPath, port: this.options.port });

    // Check if package.json exists and determine the start command
    const packageJsonPath = path.join(this.options.projectPath, 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
      throw new Error('No package.json found in project directory');
    }

    const packageJson = await fs.readJson(packageJsonPath);
    const scripts = packageJson.scripts || {};
    const startScript = scripts.dev || scripts.start;

    if (!startScript) {
      throw new Error('No "dev" or "start" script found in package.json');
    }

    // Determine the command to run
    const isNpm = await this.shouldUseNpm();
    const command = isNpm ? 'npm' : 'yarn';
    const args = ['run', startScript.split(':')[0].trim()]; // Extract script name before any colon

    // Start the server process
    this.serverProcess = spawn(command, args, {
      cwd: this.options.projectPath,
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: String(this.options.port),
      },
    });

    this.serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      logger.debug('Dev server stdout:', { output: output.trim() });

      // Check for common "ready" indicators
      if (output.includes('ready') || output.includes('compiled') || output.includes('Local:') || output.includes('http://localhost')) {
        this.isReady = true;
        logger.info('Development server appears to be ready');
      }
    });

    this.serverProcess.stderr?.on('data', (data) => {
      logger.warn('Dev server stderr:', { error: data.toString().trim() });
    });

    this.serverProcess.on('close', (code) => {
      logger.info('Development server exited', { code });
      this.isReady = false;
    });

    this.serverProcess.on('error', (error) => {
      logger.error('Failed to start development server', { error: error.message });
    });

    // Wait for server to be ready
    await this.waitForServerReady();
    logger.info('Development server started successfully', { port: this.options.port });
  }

  /**
   * Stop the development server
   */
  async stop(): Promise<void> {
    if (this.serverProcess) {
      logger.info('Stopping development server');
      this.serverProcess.kill('SIGTERM');

      // Give it a chance to exit gracefully
      await new Promise<void>((resolve) => {
        this.serverProcess!.on('exit', () => resolve());
        setTimeout(() => {
          if (this.serverProcess) {
            this.serverProcess.kill('SIGKILL');
            resolve();
          }
        }, 5000);
      });

      this.serverProcess = null;
      this.isReady = false;
      logger.info('Development server stopped');
    }
  }

  /**
   * Check if the server is running and ready
   */
  isServerReady(): boolean {
    return this.isReady;
  }

  /**
   * Get the server URL
   */
  getServerUrl(): string {
    return `http://localhost:${this.options.port}`;
  }

  /**
   * Wait for server to be ready by checking port availability
   */
  private async waitForServerReady(): Promise<void> {
    const startTime = Date.now();
    const port = this.options.port;

    // Wait for port to become available
    while (Date.now() - startTime < this.options.timeout) {
      try {
        const socket = new net.Socket();
        await new Promise<void>((resolve, reject) => {
          socket.on('connect', () => {
            socket.destroy();
            resolve();
          });
          socket.on('error', (err: any) => {
            if (err.code === 'ECONNREFUSED' || err.code === 'EHOSTUNREACH') {
              // Server not ready yet, this is expected
              reject(new Error('Connection refused'));
            } else {
              reject(err);
            }
          });
          socket.connect(port, 'localhost');
        });

        // Port is open, server is ready
        this.isReady = true;
        return;
      } catch {
        // Server not ready yet, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error(`Timed out waiting for development server to start on port ${port} after ${this.options.timeout}ms`);
  }

  /**
   * Detect whether to use npm or yarn based on lock files
   */
  private async shouldUseNpm(): Promise<boolean> {
    const yarnLock = path.join(this.options.projectPath, 'yarn.lock');
    const packageLock = path.join(this.options.projectPath, 'package-lock.json');

    try {
      if (await fs.pathExists(yarnLock)) {
        return false;
      }
      if (await fs.pathExists(packageLock)) {
        return true;
      }
    } catch {
      // Ignore errors checking lock files
    }

    // Default to npm
    return true;
  }
}
