import { BaseAgent } from './BaseAgent';
import { ProjectContext, Sprint, SprintResult } from '../types/project';
import { GitManager } from '../core/GitManager';
import fs from 'fs-extra';
import path from 'path';

export class GeneratorAgent extends BaseAgent {
  private gitManager: GitManager | undefined;
  private projectPath: string | undefined;

  constructor() {
    super('generator');
  }

  /**
   * Initialize the generator agent for a specific project
   */
  async initializeForProject(projectPath: string): Promise<void> {
    await this.initialize();

    this.projectPath = projectPath;
    this.gitManager = new GitManager(projectPath);

    // Create project directory if it doesn't exist
    await fs.mkdirp(projectPath);

    // Initialize git repository if not already initialized
    if (!await this.gitManager.isRepository()) {
      await this.gitManager.init();
    }

    this.logger.info('Generator agent initialized for project', { projectPath });
  }

  /**
   * Initialize project structure from template
   */
  async initializeProjectStructure(context: ProjectContext): Promise<void> {
    if (!this.projectPath || !this.gitManager) {
      throw new Error('Generator not initialized for project');
    }

    this.logger.info('Initializing project structure', {
      techStack: context.specification.techStack,
    });

    const prompt = `
Initialize the project structure for the following project:

Project Title: ${context.specification.title}
Project Description: ${context.specification.description}
Technology Stack: ${JSON.stringify(context.specification.techStack)}
Architecture: ${JSON.stringify(context.specification.architecture)}

Generate the complete project structure including:
1. All necessary configuration files (package.json, tsconfig.json, etc.)
2. Directory structure for source code
3. Initial boilerplate code
4. README.md with project information
5. .gitignore file

Provide the output as a JSON object where keys are file paths and values are file contents.
Only include files that are necessary for the initial project setup.
    `.trim();

    const response = await this.generateResponse(prompt);
    const fileStructure = JSON.parse(response.content);

    // Write all files to disk
    for (const [filePath, content] of Object.entries(fileStructure)) {
      const fullPath = path.join(this.projectPath, filePath);
      await fs.mkdirp(path.dirname(fullPath));
      await fs.writeFile(fullPath, content as string);
    }

    // Create initial commit
    await this.gitManager.addAndCommit('Initial project structure');

    this.logger.info('Project structure initialized successfully');
  }

  /**
   * Execute a single sprint
   */
  async executeSprint(sprint: Sprint, context: ProjectContext): Promise<SprintResult> {
    if (!this.projectPath || !this.gitManager) {
      throw new Error('Generator not initialized for project');
    }

    this.logger.info(`Executing sprint ${sprint.sprintNumber}: ${sprint.title}`, {
      tasks: sprint.tasks.length,
      deliverables: sprint.deliverables,
    });

    try {
      // Create a snapshot before starting the sprint
      await this.gitManager.createSnapshot(`sprint-${sprint.sprintNumber}-start`);

      const prompt = `
Implement the following sprint tasks for the project:

Project Context:
${JSON.stringify(context.specification, null, 2)}

Sprint Information:
Sprint ${sprint.sprintNumber}: ${sprint.title}
Description: ${sprint.description}
Tasks to implement:
${sprint.tasks.map((task, index) => `${index + 1}. ${task.title}: ${task.description}`).join('\n')}
Deliverables expected:
${sprint.deliverables.map(d => `- ${d}`).join('\n')}

Current project directory structure:
${await this.getDirectoryStructure()}

Instructions:
1. Implement all tasks described in the sprint
2. Follow the project's coding standards and architecture
3. Ensure all code is functional and follows best practices
4. Write clean, maintainable, well-commented code
5. Update any necessary configuration files
6. Add tests for new functionality where appropriate

Provide the output as a JSON object where keys are file paths (relative to project root) and values are the new file contents.
Only include files that were modified or added during this sprint.
      `.trim();

      const response = await this.generateResponse(prompt);
      const changedFiles = JSON.parse(response.content);

      // Write all changed files to disk
      for (const [filePath, content] of Object.entries(changedFiles)) {
        const fullPath = path.join(this.projectPath, filePath);
        await fs.mkdirp(path.dirname(fullPath));
        await fs.writeFile(fullPath, content as string);
      }

      // Create git commit for the sprint
      const commitMessage = `Sprint ${sprint.sprintNumber}: ${sprint.title}\n\nImplemented:\n${sprint.tasks.map(t => `- ${t.title}`).join('\n')}`;
      const commitResult = await this.gitManager.addAndCommit(commitMessage);

      this.logger.info(`Sprint ${sprint.sprintNumber} completed successfully`, {
        commitHash: commitResult.commit,
        filesChanged: Object.keys(changedFiles).length,
      });

      return {
        sprintId: sprint.id,
        success: true,
        generatedFiles: Object.keys(changedFiles),
        gitCommitHash: commitResult.commit,
        buildStatus: true, // We'll add actual build checking later
        testStatus: true, // We'll add actual test running later
      };

    } catch (error) {
      this.logger.error(`Sprint ${sprint.sprintNumber} failed`, { error });

      return {
        sprintId: sprint.id,
        success: false,
        generatedFiles: [],
        gitCommitHash: '',
        buildStatus: false,
        testStatus: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Integrate feedback from evaluator and improve the code
   */
  async integrateFeedback(feedback: string, context: ProjectContext): Promise<string[]> {
    if (!this.projectPath || !this.gitManager) {
      throw new Error('Generator not initialized for project');
    }

    this.logger.info('Integrating evaluator feedback');

    const prompt = `
Improve the project based on the following feedback:

Feedback:
${feedback}

Project Context:
${JSON.stringify(context.specification, null, 2)}

Current project directory structure:
${await this.getDirectoryStructure()}

Make the necessary changes to address all the feedback points.
Provide the output as a JSON object where keys are file paths (relative to project root) and values are the new file contents.
Only include files that were modified.
    `.trim();

    const response = await this.generateResponse(prompt);
    const changedFiles = JSON.parse(response.content);

    // Write all changed files to disk
    for (const [filePath, content] of Object.entries(changedFiles)) {
      const fullPath = path.join(this.projectPath, filePath);
      await fs.mkdirp(path.dirname(fullPath));
      await fs.writeFile(fullPath, content as string);
    }

    // Create git commit for the changes
    await this.gitManager.addAndCommit('Integrate evaluator feedback and improvements');

    this.logger.info('Feedback integration completed', {
      filesChanged: Object.keys(changedFiles).length,
    });

    return Object.keys(changedFiles);
  }

  /**
   * Get the current project directory structure
   */
  private async getDirectoryStructure(): Promise<string> {
    if (!this.projectPath) {
      return '';
    }

    // Simple directory structure generation
    const scanDirectory = async (dir: string, prefix: string = ''): Promise<string> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      let result = '';

      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;

        if (entry.isDirectory()) {
          result += `${prefix}${entry.name}/\n`;
          result += await scanDirectory(path.join(dir, entry.name), `${prefix}  `);
        } else {
          result += `${prefix}${entry.name}\n`;
        }
      }

      return result;
    };

    return scanDirectory(this.projectPath);
  }

  /**
   * Main execution method
   */
  async execute(input: {
    projectPath: string;
    context: ProjectContext;
    sprint?: Sprint;
    feedback?: string;
  }): Promise<any> {
    await this.initializeForProject(input.projectPath);

    if (input.feedback) {
      return this.integrateFeedback(input.feedback, input.context);
    } else if (input.sprint) {
      return this.executeSprint(input.sprint, input.context);
    } else {
      await this.initializeProjectStructure(input.context);
      return { success: true };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await super.cleanup();
    this.gitManager = undefined;
    this.projectPath = undefined;
  }
}
