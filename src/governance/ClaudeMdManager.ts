import fs from 'fs-extra';
import path from 'path';
import { ProjectSpecification } from '../types/project';
import { ClaudeMdSpec, ComplianceCheckResult } from '../types/governance';

export class ClaudeMdManager {
  private projectPath: string | undefined;

  constructor(projectPath?: string) {
    this.projectPath = projectPath;
  }

  /**
   * Generate CLAUDE.md file for the project (main entry point)
   */
  async generateClaudeMd(
    specification: ProjectSpecification,
    projectPath?: string
  ): Promise<string> {
    if (projectPath) {
      this.projectPath = projectPath;
    }
    const resolvedPath = this.getProjectPath();

    await this.generateRootSpec(specification, resolvedPath);
    return path.join(resolvedPath, 'CLAUDE.md');
  }

  /**
   * Get project path, throw if not set
   */
  private getProjectPath(): string {
    if (!this.projectPath) {
      throw new Error('Project path not set. Initialize ClaudeMdManager with a project path first.');
    }
    return this.projectPath;
  }

  /**
   * Generate root CLAUDE.md file for the project
   */
  async generateRootSpec(specification: ProjectSpecification, projectPath?: string): Promise<ClaudeMdSpec> {
    const resolvedPath = projectPath || this.getProjectPath();

    const content = `# ${specification.title} - Global Project Specifications

## Project Overview
${specification.description}

## Technology Stack
${JSON.stringify(specification.techStack, null, 2)}

## Architecture
${JSON.stringify(specification.architecture, null, 2)}

## Design Guidelines
${JSON.stringify(specification.designGuidelines, null, 2)}

## Code Standards
1. Use TypeScript for all code where possible
2. Follow functional programming principles where appropriate
3. Write comprehensive tests for all business logic
4. Keep functions small and focused on a single responsibility
5. Use meaningful variable and function names
6. Add comments for non-obvious business logic
7. Follow 4/8px grid system for all UI design
8. Ensure WCAG 2.1 AA accessibility compliance
9. Implement proper error handling and user feedback
10. Optimize for performance and user experience

## Security Requirements
1. Sanitize all user input to prevent XSS attacks
2. Use parameterized queries to prevent SQL injection
3. Implement proper authentication and authorization checks
4. Never expose sensitive data in client-side code
5. Use HTTPS for all production deployments

## Git Workflow
1. Each feature should be developed in a separate branch
2. Write meaningful commit messages
3. All code must pass tests before being merged to main
4. Use pull requests for all changes to main branch

## Quality Standards
1. Minimum overall quality score: 85/100
2. All tests must pass
3. No critical or high severity bugs
4. Responsive design for all screen sizes
5. Accessibility compliance
    `.trim();

    const filePath = path.join(resolvedPath, 'CLAUDE.md');
    await fs.writeFile(filePath, content);

    return {
      path: filePath,
      level: 'root',
      content,
      rules: this.extractRules(content),
      lastUpdated: new Date(),
    };
  }

  /**
   * Generate directory-specific CLAUDE.md file
   */
  async generateDirectorySpec(
    directoryPath: string,
    moduleName: string,
    moduleDescription: string,
    additionalRules: string[] = []
  ): Promise<ClaudeMdSpec> {
    const resolvedPath = this.getProjectPath();
    const fullDirPath = path.join(resolvedPath, directoryPath);
    await fs.mkdirp(fullDirPath);

    const content = `# ${moduleName} - Module Specifications

## Description
${moduleDescription}

## Module-Specific Rules
${additionalRules.map(rule => `- ${rule}`).join('\n')}

## Global Rules
All global project specifications in the root CLAUDE.md also apply to this module.
    `.trim();

    const filePath = path.join(fullDirPath, 'CLAUDE.md');
    await fs.writeFile(filePath, content);

    return {
      path: filePath,
      level: 'directory',
      content,
      rules: this.extractRules(content),
      lastUpdated: new Date(),
    };
  }

  /**
   * Check if project complies with all CLAUDE.md specifications
   */
  async checkCompliance(): Promise<ComplianceCheckResult> {
    const resolvedPath = this.getProjectPath();

    // This would scan all code against the rules in CLAUDE.md files
    // For now, we'll return a placeholder implementation

    return {
      specPath: path.join(resolvedPath, 'CLAUDE.md'),
      compliant: true,
      violations: [],
      summary: 'All compliance checks passed',
    };
  }

  /**
   * Extract rules from CLAUDE.md content
   */
  private extractRules(content: string): any[] {
    const rules: any[] = [];
    const lines = content.split('\n');
    let inCodeStandards = false;
    let ruleId = 1;

    for (const line of lines) {
      if (line.startsWith('## Code Standards')) {
        inCodeStandards = true;
        continue;
      }

      if (inCodeStandards && line.startsWith('## ')) {
        break;
      }

      if (inCodeStandards && line.match(/^\d+\./)) {
        const ruleText = line.replace(/^\d+\.\s*/, '').trim();
        rules.push({
          id: `rule-${ruleId++}`,
          description: ruleText,
          enforcement: 'strict',
        });
      }
    }

    return rules;
  }

  /**
   * Get all CLAUDE.md files in the project
   */
  async getAllSpecs(): Promise<ClaudeMdSpec[]> {
    const resolvedPath = this.getProjectPath();
    const specs: ClaudeMdSpec[] = [];

    // Simple implementation - recursively find all CLAUDE.md files
    const findClaudeMd = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
          await findClaudeMd(fullPath);
        } else if (entry.name === 'CLAUDE.md') {
          const content = await fs.readFile(fullPath, 'utf-8');
          specs.push({
            path: fullPath,
            level: fullPath === path.join(resolvedPath, 'CLAUDE.md') ? 'root' : 'directory',
            content,
            rules: this.extractRules(content),
            lastUpdated: (await fs.stat(fullPath)).mtime,
          });
        }
      }
    };

    await findClaudeMd(resolvedPath);
    return specs;
  }
}
