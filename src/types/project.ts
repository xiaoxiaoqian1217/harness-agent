import { z } from 'zod';

export const TechStackTypeSchema = z.enum([
  'react-vite',
  'react-nextjs',
  'vue-vite',
  'vue-nuxt',
  'vanilla-js',
  'node-express',
  'node-nestjs',
  'python-fastapi',
  'golang-gin',
]);
export type TechStackType = z.infer<typeof TechStackTypeSchema>;

export const TechStackSchema = z.object({
  frontend: TechStackTypeSchema.optional(),
  backend: TechStackTypeSchema.optional(),
  database: z.enum(['sqlite', 'postgresql', 'mysql', 'mongodb']).optional(),
  fullStack: TechStackTypeSchema.optional(),
  isSeparate: z.boolean().default(false),
});
export type TechStack = z.infer<typeof TechStackSchema>;

export const ProjectRequirementsSchema = z.object({
  rawDescription: z.string(),
  features: z.array(z.string()),
  targetAudience: z.string().optional(),
  designPreferences: z.string().optional(),
  performanceRequirements: z.string().optional(),
  securityRequirements: z.string().optional(),
});
export type ProjectRequirements = z.infer<typeof ProjectRequirementsSchema>;

export const ProjectSpecificationSchema = z.object({
  title: z.string(),
  description: z.string(),
  requirements: ProjectRequirementsSchema,
  techStack: TechStackSchema,
  architecture: z.object({
    isSeparateFrontendBackend: z.boolean(),
    components: z.array(z.string()),
    dataFlow: z.string(),
  }),
  designGuidelines: z.object({
    colorScheme: z.string(),
    typography: z.string(),
    designSystem: z.string(),
    responsive: z.boolean(),
  }),
});
export type ProjectSpecification = z.infer<typeof ProjectSpecificationSchema>;

export const SprintTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  components: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  estimatedHours: z.number(),
});
export type SprintTask = z.infer<typeof SprintTaskSchema>;

export const SprintSchema = z.object({
  id: z.string(),
  sprintNumber: z.number(),
  title: z.string(),
  description: z.string(),
  tasks: z.array(SprintTaskSchema),
  deliverables: z.array(z.string()),
  durationDays: z.number(),
});
export type Sprint = z.infer<typeof SprintSchema>;

export const ProjectPlanSchema = z.object({
  specification: ProjectSpecificationSchema,
  totalSprints: z.number(),
  sprints: z.array(SprintSchema),
  estimatedTotalHours: z.number(),
  riskAssessment: z.array(z.object({
    risk: z.string(),
    mitigation: z.string(),
  })),
});
export type ProjectPlan = z.infer<typeof ProjectPlanSchema>;

export const SprintResultSchema = z.object({
  sprintId: z.string(),
  success: z.boolean(),
  generatedFiles: z.array(z.string()),
  gitCommitHash: z.string(),
  buildStatus: z.boolean(),
  testStatus: z.boolean(),
  errors: z.array(z.string()).optional(),
});
export type SprintResult = z.infer<typeof SprintResultSchema>;

export const ProjectContextSchema = z.object({
  projectId: z.string(),
  projectPath: z.string(),
  specification: ProjectSpecificationSchema,
  plan: ProjectPlanSchema,
  currentSprint: z.number(),
  iterationCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProjectContext = z.infer<typeof ProjectContextSchema>;
