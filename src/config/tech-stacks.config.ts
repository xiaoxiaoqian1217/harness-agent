import { TechStackType, TechStack } from '../types/project';

export interface TechStackDefinition {
  id: TechStackType;
  name: string;
  category: 'frontend' | 'backend' | 'fullstack';
  description: string;
  useCases: string[];
  dependencies: string[];
  templatePath: string;
  isSeparateBackend?: boolean;
  isSeparateFrontend?: boolean;
}

export const techStackDefinitions: Record<TechStackType, TechStackDefinition> = {
  'react-vite': {
    id: 'react-vite',
    name: 'React + Vite',
    category: 'frontend',
    description: 'Modern React single-page application with Vite build tool',
    useCases: ['Single-page applications', 'Complex UIs', 'Interactive web apps'],
    dependencies: ['react', 'react-dom', 'vite', '@vitejs/plugin-react'],
    templatePath: 'templates/react-vite',
    isSeparateFrontend: true,
  },

  'react-nextjs': {
    id: 'react-nextjs',
    name: 'Next.js (React)',
    category: 'fullstack',
    description: 'Full-stack React framework with SSR/SSG support',
    useCases: ['E-commerce sites', 'Content sites', 'Full-stack applications', 'SEO-friendly sites'],
    dependencies: ['next', 'react', 'react-dom'],
    templatePath: 'templates/nextjs',
  },

  'vue-vite': {
    id: 'vue-vite',
    name: 'Vue + Vite',
    category: 'frontend',
    description: 'Vue 3 single-page application with Vite build tool',
    useCases: ['Single-page applications', 'Progressive web apps', 'Interactive UIs'],
    dependencies: ['vue', '@vitejs/plugin-vue', 'vite'],
    templatePath: 'templates/vue-vite',
    isSeparateFrontend: true,
  },

  'vue-nuxt': {
    id: 'vue-nuxt',
    name: 'Nuxt.js (Vue)',
    category: 'fullstack',
    description: 'Full-stack Vue framework with SSR/SSG support',
    useCases: ['Content sites', 'E-commerce', 'Full-stack applications'],
    dependencies: ['nuxt', 'vue'],
    templatePath: 'templates/nuxt',
  },

  'vanilla-js': {
    id: 'vanilla-js',
    name: 'Vanilla JavaScript/CSS/HTML',
    category: 'frontend',
    description: 'Simple static site with no framework',
    useCases: ['Landing pages', 'Simple websites', 'Static content'],
    dependencies: [],
    templatePath: 'templates/vanilla',
    isSeparateFrontend: true,
  },

  'node-express': {
    id: 'node-express',
    name: 'Node.js + Express',
    category: 'backend',
    description: 'Node.js backend with Express framework',
    useCases: ['RESTful APIs', 'Microservices', 'Web backends'],
    dependencies: ['express', 'cors', 'dotenv', 'express-rate-limit'],
    templatePath: 'templates/node-express',
    isSeparateBackend: true,
  },

  'node-nestjs': {
    id: 'node-nestjs',
    name: 'NestJS',
    category: 'backend',
    description: 'Enterprise-grade Node.js framework',
    useCases: ['Enterprise applications', 'Microservices', 'Large-scale backends'],
    dependencies: ['@nestjs/core', '@nestjs/common', '@nestjs/platform-express'],
    templatePath: 'templates/nestjs',
    isSeparateBackend: true,
  },

  'python-fastapi': {
    id: 'python-fastapi',
    name: 'Python + FastAPI',
    category: 'backend',
    description: 'Python backend with FastAPI framework',
    useCases: ['APIs', 'Machine learning services', 'Data processing backends'],
    dependencies: ['fastapi', 'uvicorn', 'pydantic'],
    templatePath: 'templates/fastapi',
    isSeparateBackend: true,
  },

  'golang-gin': {
    id: 'golang-gin',
    name: 'Go + Gin',
    category: 'backend',
    description: 'Go backend with Gin framework',
    useCases: ['High-performance APIs', 'Microservices', 'High-throughput services'],
    dependencies: ['gin-gonic/gin'],
    templatePath: 'templates/gin',
    isSeparateBackend: true,
  },
};

export const recommendedStackCombinations: { name: string; stack: TechStack; useCase: string }[] = [
  {
    name: 'React + Node.js Full Stack',
    stack: {
      frontend: 'react-vite',
      backend: 'node-express',
      database: 'sqlite',
      isSeparate: true,
    },
    useCase: 'General purpose full-stack applications, admin dashboards, SaaS apps',
  },
  {
    name: 'Next.js Full Stack',
    stack: {
      fullStack: 'react-nextjs',
      database: 'postgresql',
      isSeparate: false,
    },
    useCase: 'E-commerce, content sites, SEO-friendly applications',
  },
  {
    name: 'Vue + Python Full Stack',
    stack: {
      frontend: 'vue-vite',
      backend: 'python-fastapi',
      database: 'postgresql',
      isSeparate: true,
    },
    useCase: 'Data science applications, ML dashboards, AI services',
  },
  {
    name: 'Static Site',
    stack: {
      frontend: 'vanilla-js',
      isSeparate: false,
    },
    useCase: 'Landing pages, marketing sites, simple static content',
  },
];
