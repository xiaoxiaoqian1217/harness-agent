#!/usr/bin/env node

import { Command } from 'commander';
import { PlannerAgent, GeneratorAgent, EvaluatorAgent } from './agents';
import { AdversarialLoop } from './quality';
import { ClaudeMdManager, ContextManager } from './governance';
import { ProjectContext } from './types/project';
import dotenv from 'dotenv';
import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import inquirer from 'inquirer';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

const program = new Command();

program
  .name('harness-agent')
  .description('Harness-style AI agent for full-stack application generation')
  .version('1.0.0');

// Initialize command
program
  .command('init')
  .description('Initialize a new project')
  .argument('<requirement>', 'Project requirement description')
  .option('--stack <stack>', 'Specify tech stack (e.g., react-fastapi)')
  .option('--frontend <frontend>', 'Specify frontend technology')
  .option('--backend <backend>', 'Specify backend technology')
  .option('--database <database>', 'Specify database technology')
  .option('-o, --output <path>', 'Output directory path', './my-project')
  .action(async (requirement: string, options: any) => {
    console.log(chalk.blue.bold('\n🚀 Harness AI Agent - Project Initialization\n'));

    try {
      // Validate API key
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log(chalk.yellow('⚠️  ANTHROPIC_API_KEY not found in environment variables.'));
        const apiKeyAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'apiKey',
            message: 'Please enter your Anthropic API key:',
            validate: (input: string) => input.trim().length > 0 || 'API key is required',
          },
        ]);
        process.env.ANTHROPIC_API_KEY = apiKeyAnswer.apiKey;
      }

      // Resolve output path
      const outputPath = path.resolve(options.output);
      console.log(chalk.gray(`📁 Project path: ${outputPath}`));

      // Create output directory if it doesn't exist
      await fs.mkdirp(outputPath);

      // Initialize agents and managers
      console.log(chalk.gray('\n📋 Initializing agents...'));

      const plannerAgent = new PlannerAgent();
      const generatorAgent = new GeneratorAgent();
      const evaluatorAgent = new EvaluatorAgent();
      const claudeMdManager = new ClaudeMdManager();
      const contextManager = new ContextManager();

      await plannerAgent.initialize();

      // Step 1: Planner creates specification and plan
      console.log(chalk.blue('\n📝 Step 1: Analyzing requirements and creating plan...'));

      const techStackOptions = {
        stack: options.stack,
        frontend: options.frontend,
        backend: options.backend,
        database: options.database,
      };

      const plannerOutput = await plannerAgent.execute({
        requirement,
        techStack: techStackOptions,
        outputPath,
      });

      if (!plannerOutput.success) {
        throw new Error(plannerOutput.error || 'Planner agent failed');
      }

      const projectContext: ProjectContext = plannerOutput.context;

      // Generate CLAUDE.md
      console.log(chalk.gray('   Generating CLAUDE.md specification...'));
      const claudeMdPath = await claudeMdManager.generateClaudeMd(
        projectContext.specification,
        outputPath
      );
      console.log(chalk.green(`   ✅ CLAUDE.md created at: ${claudeMdPath}`));

      // Display project plan
      console.log(chalk.blue('\n📋 Project Plan:'));
      console.log(chalk.white(`   Title: ${projectContext.specification.title}`));
      console.log(chalk.white(`   Description: ${projectContext.specification.description}`));
      console.log(chalk.white(`   Tech Stack: ${JSON.stringify(projectContext.specification.techStack)}`));
      console.log(chalk.white(`   Total Sprints: ${projectContext.plan.totalSprints}`));

      for (const sprint of projectContext.plan.sprints) {
        console.log(chalk.gray(`\n   Sprint ${sprint.sprintNumber}: ${sprint.title}`));
        console.log(chalk.gray(`   ${sprint.description}`));
        console.log(chalk.gray(`   Tasks: ${sprint.tasks.length}`));
      }

      // Ask for confirmation
      const confirmAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Do you want to proceed with this plan?',
          default: true,
        },
      ]);

      if (!confirmAnswer.proceed) {
        console.log(chalk.yellow('\n👋 Project initialization cancelled.'));
        await plannerAgent.cleanup();
        process.exit(0);
      }

      // Step 2: Initialize project structure
      console.log(chalk.blue('\n🏗️  Step 2: Initializing project structure...'));

      await generatorAgent.initializeForProject(outputPath);
      await generatorAgent.execute({
        projectPath: outputPath,
        context: projectContext,
      });

      console.log(chalk.green('   ✅ Project structure initialized'));

      // Step 3: Set up adversarial loop and execute sprints
      console.log(chalk.blue('\n⚡ Step 3: Starting development sprints...'));

      await evaluatorAgent.initialize(outputPath);

      const adversarialLoop = new AdversarialLoop(generatorAgent, evaluatorAgent);

      const allIterationResults = await adversarialLoop.runFullProjectLoop(
        projectContext,
        outputPath
      );

      // Save state
      await contextManager.saveState(projectContext, outputPath);

      // Display summary
      console.log(chalk.blue.bold('\n🎉 Project Generation Complete!\n'));

      const totalIterations = allIterationResults.flat().length;
      const finalResult = allIterationResults[allIterationResults.length - 1]?.[
        allIterationResults[allIterationResults.length - 1].length - 1
      ];

      if (finalResult) {
        console.log(chalk.green(`   Final Quality Score: ${finalResult.qualityScore.overall}/100`));
        console.log(chalk.gray(`   Total Iterations: ${totalIterations}`));
        console.log(chalk.gray(`   Total Sprints: ${allIterationResults.length}`));
      }

      console.log(chalk.blue('\n📂 Project Location:'));
      console.log(chalk.white(`   ${outputPath}`));

      console.log(chalk.blue('\n📖 Next Steps:'));
      console.log(chalk.white(`   1. cd ${options.output}`));
      console.log(chalk.white('   2. Follow the instructions in README.md to set up and run the project'));
      console.log(chalk.white(`   3. Use 'harness-agent resume ${options.output}' to continue development if needed`));
      console.log(chalk.white(`   4. Use 'harness-agent evaluate ${options.output}' to run quality assessment`));

      // Clean up
      await plannerAgent.cleanup();
      await generatorAgent.cleanup();
      await evaluatorAgent.cleanup();

    } catch (error) {
      logger.error('Project initialization failed', { error });
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Resume command
program
  .command('resume')
  .description('Resume an existing project')
  .argument('<path>', 'Project directory path')
  .action(async (projectPath: string) => {
    console.log(chalk.blue.bold('\n🔄 Harness AI Agent - Resuming Project\n'));

    try {
      const resolvedPath = path.resolve(projectPath);

      if (!await fs.pathExists(resolvedPath)) {
        throw new Error(`Project path does not exist: ${resolvedPath}`);
      }

      console.log(chalk.gray(`📁 Project path: ${resolvedPath}`));

      // Load existing state
      console.log(chalk.gray('\n📋 Loading project state...'));
      const contextManager = new ContextManager();
      const projectContext = await contextManager.loadState(resolvedPath);

      if (!projectContext) {
        throw new Error('Could not load project state. Make sure this is a valid harness-agent project.');
      }

      console.log(chalk.green('   ✅ Project state loaded'));
      console.log(chalk.white(`   Title: ${projectContext.specification.title}`));
      console.log(chalk.white(`   Current Sprint: ${projectContext.currentSprint + 1}/${projectContext.plan.totalSprints}`));

      // Determine if we need to continue or start fresh
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Continue from current sprint', value: 'continue' },
            { name: 'Re-run from beginning', value: 'restart' },
            { name: 'Just evaluate current state', value: 'evaluate' },
          ],
        },
      ]);

      if (answer.action === 'evaluate') {
        program.parse(['node', 'harness-agent', 'evaluate', projectPath]);
        return;
      }

      if (answer.action === 'restart') {
        projectContext.currentSprint = 0;
      }

      // Initialize agents
      console.log(chalk.gray('\n🏃 Initializing agents...'));
      const generatorAgent = new GeneratorAgent();
      const evaluatorAgent = new EvaluatorAgent();

      await generatorAgent.initializeForProject(resolvedPath);
      await evaluatorAgent.initialize(resolvedPath);

      // Run adversarial loop
      console.log(chalk.blue('\n⚡ Continuing development...'));

      const adversarialLoop = new AdversarialLoop(generatorAgent, evaluatorAgent);

      if (answer.action === 'restart') {
        await adversarialLoop.runFullProjectLoop(projectContext, resolvedPath);
      } else {
        // Continue from current sprint
        for (let i = projectContext.currentSprint; i < projectContext.plan.sprints.length; i++) {
          const sprint = projectContext.plan.sprints[i];
          projectContext.currentSprint = i;

          console.log(chalk.gray(`\n   Sprint ${i + 1}/${projectContext.plan.totalSprints}: ${sprint.title}`));

          await adversarialLoop.runSprintLoop(sprint, projectContext, resolvedPath);
        }
      }

      // Save updated state
      await contextManager.saveState(projectContext, resolvedPath);

      console.log(chalk.green.bold('\n✅ Project resumed and completed successfully!\n'));

      await generatorAgent.cleanup();
      await evaluatorAgent.cleanup();

    } catch (error) {
      logger.error('Failed to resume project', { error });
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Evaluate command
program
  .command('evaluate')
  .description('Evaluate project quality')
  .argument('<path>', 'Project directory path')
  .option('--screenshots', 'Capture screenshots for visual evaluation')
  .option('--run-tests', 'Run E2E tests')
  .action(async (projectPath: string, _options: any) => {
    console.log(chalk.blue.bold('\n🔍 Harness AI Agent - Quality Evaluation\n'));

    try {
      const resolvedPath = path.resolve(projectPath);

      if (!await fs.pathExists(resolvedPath)) {
        throw new Error(`Project path does not exist: ${resolvedPath}`);
      }

      console.log(chalk.gray(`📁 Project path: ${resolvedPath}`));

      // Load project context
      const contextManager = new ContextManager();
      const projectContext = await contextManager.loadState(resolvedPath);

      if (!projectContext) {
        console.log(chalk.yellow('⚠️  Could not load project state, creating minimal context for evaluation'));
        // Create minimal context
      }

      // Initialize evaluator
      console.log(chalk.gray('\n📋 Initializing evaluator...'));
      const evaluatorAgent = new EvaluatorAgent();
      await evaluatorAgent.initialize(resolvedPath);

      // Run evaluation
      console.log(chalk.blue('\n📊 Running quality evaluation...'));

      const evaluationFeedback = await evaluatorAgent.execute({
        context: projectContext!,
        projectPath: resolvedPath,
      });

      // Display results
      console.log(chalk.blue.bold('\n📈 Quality Evaluation Results:\n'));

      console.log(chalk.white(`   Overall Score: ${chalk.bold(evaluationFeedback.qualityScore.overall)}/100`));
      console.log(chalk.gray(`   Status: ${evaluationFeedback.qualityScore.pass ? chalk.green('✅ PASSED') : chalk.red('❌ NEEDS IMPROVEMENT')}`));

      console.log(chalk.blue('\n   Dimension Scores:'));
      for (const [dimension, score] of Object.entries(evaluationFeedback.qualityScore.dimensions)) {
        const dimensionName = {
          designQuality: 'Design Quality',
          originality: 'Originality',
          craftExecution: 'Craft Execution',
          functionalUsability: 'Functional Usability',
        }[dimension] || dimension;

        console.log(chalk.white(`   ${dimensionName}: ${score.score}/100`));
        console.log(chalk.gray(`      ${score.feedback}`));
      }

      if (evaluationFeedback.improvementPoints.length > 0) {
        console.log(chalk.blue('\n   Improvement Points:'));
        for (const point of evaluationFeedback.improvementPoints) {
          const priorityColor = {
            critical: chalk.red,
            high: chalk.yellow,
            medium: chalk.blue,
            low: chalk.gray,
          }[point.priority] || chalk.white;

          console.log(chalk.white(`   ${priorityColor(`[${point.priority.toUpperCase()}]`)} ${point.description}`));
        }
      }

      console.log(chalk.blue('\n   Summary:'));
      console.log(chalk.gray(`   ${evaluationFeedback.qualityScore.summary}`));

      await evaluatorAgent.cleanup();

    } catch (error) {
      logger.error('Evaluation failed', { error });
      console.error(chalk.red('\n❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .option('--list', 'List current configuration')
  .option('--set <key=value>', 'Set a configuration value')
  .action((_options: any) => {
    console.log(chalk.blue.bold('\n⚙️  Harness AI Agent - Configuration\n'));
    console.log(chalk.white('   Current Configuration:'));
    console.log(chalk.gray('   ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '***' : '(not set)'));
    console.log(chalk.gray('   LOG_LEVEL:', process.env.LOG_LEVEL || 'info'));
    console.log(chalk.gray('\n   Configuration can be set via environment variables or .env file.'));
    console.log('');
  });

// Stacks command
program
  .command('stacks')
  .description('List supported technology stacks')
  .action(() => {
    console.log(chalk.blue.bold('\n🛠️  Harness AI Agent - Supported Technology Stacks\n'));

    console.log(chalk.white('   Frontend:'));
    console.log(chalk.gray('   • react-vite      - React + Vite + TypeScript'));
    console.log(chalk.gray('   • react-nextjs    - React + Next.js + TypeScript'));
    console.log(chalk.gray('   • vue-vite        - Vue + Vite + TypeScript'));
    console.log(chalk.gray('   • vue-nuxt        - Vue + Nuxt + TypeScript'));
    console.log(chalk.gray('   • vanilla-js      - Vanilla JavaScript + HTML/CSS'));

    console.log(chalk.white('\n   Backend:'));
    console.log(chalk.gray('   • node-express    - Node.js + Express + TypeScript'));
    console.log(chalk.gray('   • node-nestjs     - Node.js + NestJS + TypeScript'));
    console.log(chalk.gray('   • python-fastapi  - Python + FastAPI'));
    console.log(chalk.gray('   • golang-gin      - Go + Gin'));

    console.log(chalk.white('\n   Databases:'));
    console.log(chalk.gray('   • sqlite          - SQLite (file-based)'));
    console.log(chalk.gray('   • postgresql      - PostgreSQL'));
    console.log(chalk.gray('   • mysql           - MySQL'));
    console.log(chalk.gray('   • mongodb         - MongoDB'));

    console.log(chalk.white('\n   Preset Stacks:'));
    console.log(chalk.gray('   • react-fastapi   - React + Vite + FastAPI + SQLite'));
    console.log(chalk.gray('   • react-express   - React + Vite + Express + SQLite'));
    console.log(chalk.gray('   • vue-fastapi     - Vue + Vite + FastAPI + SQLite'));
    console.log(chalk.gray('   • fullstack-next  - Next.js (full-stack) + PostgreSQL'));

    console.log(chalk.blue('\n💡 Usage Examples:'));
    console.log(chalk.gray('   harness-agent init "My project" --stack react-fastapi'));
    console.log(chalk.gray('   harness-agent init "My project" --frontend react-vite --backend node-express --database postgresql'));
    console.log('');
  });

// Parse and run
program.parse();
