import { BaseAgent } from './BaseAgent';
import { ProjectRequirements, ProjectSpecification, ProjectPlan, TechStack, Sprint } from '../types/project';
import { z } from 'zod';

const StructuredRequirementsSchema = z.object({
  title: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  technicalRequirements: z.array(z.string()).optional(),
  designRequirements: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  performanceRequirements: z.string().optional(),
  securityRequirements: z.string().optional(),
});

export class PlannerAgent extends BaseAgent {
  constructor() {
    super('planner');
  }

  /**
   * Analyze raw requirements and convert to structured requirements
   */
  async analyzeRequirements(rawRequirements: string): Promise<ProjectRequirements> {
    this.logger.info('Analyzing project requirements', { rawRequirements });

    const prompt = `
Analyze the following project requirements and convert them into a structured format.

Raw requirements:
${rawRequirements}

Return ONLY a valid JSON object with the following structure:
{
  "title": "Short project title",
  "description": "Detailed project description",
  "features": ["List of core features"],
  "technicalRequirements": ["List of technical requirements (performance, security, etc.)"],
  "designRequirements": ["List of design/aesthetic requirements"]
}
    `.trim();

    const response = await this.generateResponse(prompt);

    if (!response.success) {
      throw new Error(`Failed to analyze requirements: ${response.error || 'Unknown error'}`);
    }

    const parsedRequirements = StructuredRequirementsSchema.parse(JSON.parse(response.content));

    return {
      rawDescription: rawRequirements,
      features: parsedRequirements.features,
      targetAudience: parsedRequirements.targetAudience,
      designPreferences: parsedRequirements.designRequirements?.join(', '),
      performanceRequirements: parsedRequirements.performanceRequirements,
      securityRequirements: parsedRequirements.securityRequirements,
    };
  }

  /**
   * Recommend appropriate technology stack based on requirements
   */
  async recommendTechStack(requirements: ProjectRequirements): Promise<TechStack> {
    this.logger.info('Recommending technology stack');

    const prompt = `
Based on the following project requirements, recommend the most appropriate technology stack.

Project requirements:
${requirements.rawDescription}
Features: ${requirements.features.join(', ')}
Technical requirements: ${requirements.performanceRequirements || 'None specified'}
Design requirements: ${requirements.designPreferences || 'None specified'}

Available technology stacks:
Frontend: react-vite, react-nextjs, vue-vite, vue-nuxt, vanilla-js
Backend: node-express, node-nestjs, python-fastapi, golang-gin
Databases: sqlite, postgresql, mysql, mongodb

Return ONLY a valid JSON object with the following structure:
{
  "frontend": "selected frontend stack or null",
  "backend": "selected backend stack or null",
  "database": "selected database or null",
  "fullStack": "selected full-stack framework or null",
  "isSeparate": true/false (whether to use separate frontend/backend architecture),
  "reasoning": "Explanation for why this stack was chosen"
}
    `.trim();

    const response = await this.generateResponse(prompt);

    if (!response.success) {
      throw new Error(`Failed to recommend tech stack: ${response.error || 'Unknown error'}`);
    }

    const parsedStack = JSON.parse(response.content);

    // Validate the stack against available definitions
    return {
      frontend: parsedStack.frontend,
      backend: parsedStack.backend,
      database: parsedStack.database,
      fullStack: parsedStack.fullStack,
      isSeparate: parsedStack.isSeparate,
    };
  }

  /**
   * Create detailed project specification
   */
  async createProjectSpecification(
    requirements: ProjectRequirements,
    techStack: TechStack
  ): Promise<ProjectSpecification> {
    this.logger.info('Creating project specification');

    const prompt = `
Create a detailed project specification based on the requirements and selected tech stack.

Project requirements:
${JSON.stringify(requirements, null, 2)}

Selected technology stack:
${JSON.stringify(techStack, null, 2)}

Return ONLY a valid JSON object with the following structure:
{
  "title": "Project title",
  "description": "Detailed project description",
  "requirements": { /* copy the requirements object here */ },
  "techStack": { /* copy the tech stack object here */ },
  "architecture": {
    "isSeparateFrontendBackend": true/false,
    "components": ["List of main system components"],
    "dataFlow": "Description of how data flows through the system"
  },
  "designGuidelines": {
    "colorScheme": "Recommended color scheme",
    "typography": "Recommended typography system",
    "designSystem": "Recommended design system (e.g., Tailwind, Material UI)",
    "responsive": true/false (whether to implement responsive design)
  }
}
    `.trim();

    const response = await this.generateResponse(prompt);

    if (!response.success) {
      throw new Error(`Failed to create project specification: ${response.error || 'Unknown error'}`);
    }

    const parsedSpec = JSON.parse(response.content);

    return parsedSpec as ProjectSpecification;
  }

  /**
   * Create project plan with sprints and tasks
   */
  async createProjectPlan(specification: ProjectSpecification): Promise<ProjectPlan> {
    this.logger.info('Creating project plan');

    const prompt = `
Create a detailed project implementation plan based on the project specification.
Break the project into logical sprints, each with clear tasks and deliverables.

Project specification:
${JSON.stringify(specification, null, 2)}

Return ONLY a valid JSON object with the following structure:
{
  "totalSprints": number of sprints,
  "sprints": [
    {
      "title": "Sprint title",
      "description": "Sprint description",
      "tasks": ["List of tasks to complete in this sprint"],
      "deliverables": ["List of deliverables for this sprint"],
      "estimatedHours": estimated hours to complete
    }
  ],
  "riskAssessment": [
    {
      "risk": "Potential risk",
      "mitigation": "Mitigation strategy"
    }
  ]
}
    `.trim();

    const response = await this.generateResponse(prompt);

    if (!response.success) {
      throw new Error(`Failed to create project plan: ${response.error || 'Unknown error'}`);
    }

    const parsedPlan = JSON.parse(response.content);

    // Convert to proper Sprint objects with IDs
    const sprints: (Sprint & { estimatedHours?: number })[] = parsedPlan.sprints.map((sprint: any, index: number) => ({
      id: `sprint-${index + 1}`,
      sprintNumber: index + 1,
      title: sprint.title,
      description: sprint.description,
      tasks: sprint.tasks.map((task: string, taskIndex: number) => ({
        id: `task-${index + 1}-${taskIndex + 1}`,
        title: task,
        description: task,
        components: [],
        acceptanceCriteria: [],
        estimatedHours: 2,
      })),
      deliverables: sprint.deliverables,
      durationDays: Math.ceil(sprint.estimatedHours / 8),
      estimatedHours: sprint.estimatedHours,
    }));

    return {
      specification,
      totalSprints: parsedPlan.totalSprints,
      sprints: sprints as Sprint[],
      estimatedTotalHours: sprints.reduce((sum, sprint) => sum + (sprint.estimatedHours || 0), 0),
      riskAssessment: parsedPlan.riskAssessment,
    };
  }

  /**
   * Main execution method: analyze requirements, select stack, create spec and plan
   */
  async execute(input: string | {
    requirement: string;
    techStack?: any;
    outputPath?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    context: any;
  }> {
    this.logger.info('Executing planning workflow');

    try {
      const rawRequirements = typeof input === 'string' ? input : input.requirement;

      const requirements = await this.analyzeRequirements(rawRequirements);
      const techStack = await this.recommendTechStack(requirements);
      const specification = await this.createProjectSpecification(requirements, techStack);
      const plan = await this.createProjectPlan(specification);

      // Create full project context
      const projectContext = {
        projectId: `project-${Date.now()}`,
        projectPath: typeof input === 'object' && input.outputPath ? input.outputPath : './',
        specification,
        plan,
        currentSprint: 0,
        iterationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.info('Planning workflow completed', {
        projectTitle: specification.title,
        totalSprints: plan.totalSprints,
        estimatedHours: plan.estimatedTotalHours,
      });

      return {
        success: true,
        context: projectContext,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        context: null,
      };
    }
  }
}
