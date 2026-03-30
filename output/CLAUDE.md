# Elite Task Manager - Global Project Specifications

## Project Overview
A premium-grade todo application designed with award-winning aesthetics and robust engineering. It features seamless authentication, persistent storage, and fluid interactions across devices, ensuring a delightful user experience on both desktop and mobile platforms.

## Technology Stack
{
  "frontend": "react-nextjs",
  "backend": "node-nestjs",
  "database": "postgresql",
  "isSeparate": true
}

## Architecture
{
  "isSeparateFrontendBackend": true,
  "components": [
    "Next.js Frontend Application",
    "NestJS API Gateway",
    "PostgreSQL Database Cluster",
    "JWT Authentication Service",
    "Drag-and-Drop State Manager"
  ],
  "dataFlow": "User interacts with Next.js frontend which renders pages via SSR/CSR. Actions trigger authenticated HTTP requests to NestJS backend. NestJS validates JWT tokens, executes business logic, and performs CRUD operations on PostgreSQL. Results are serialized to JSON and returned to the client for optimistic UI updates."
}

## Design Guidelines
{
  "colorScheme": "Dynamic palette supporting Light (#FFFFFF background) and Dark (#121212 background) modes with high-contrast accent colors for primary actions",
  "typography": "Inter font family for optimal screen readability and modern aesthetic",
  "designSystem": "Tailwind CSS for utility-first styling combined with Framer Motion for complex micro-interactions",
  "responsive": true
}

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