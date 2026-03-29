# Personal Portfolio & Blog Platform - Global Project Specifications

## Project Overview
A high-performance, accessible personal website featuring a project gallery, downloadable CV, secure contact form, and a fully managed blog system. Designed to showcase professional expertise while maintaining clean aesthetics and optimal SEO.

## Technology Stack
{
  "frontend": "react-nextjs",
  "backend": null,
  "database": "postgresql",
  "fullStack": "react-nextjs",
  "isSeparate": false
}

## Architecture
{
  "isSeparateFrontendBackend": false,
  "components": [
    "Next.js Application Core",
    "PostgreSQL Database",
    "Prisma ORM",
    "API Routes & Server Actions",
    "Client-Side State Management"
  ],
  "dataFlow": "User requests trigger Next.js Server Components to fetch data from PostgreSQL via Prisma ORM. Content is rendered server-side for SEO. Client-side hydration enables interactive features like theme toggling and search filtering. Admin operations route through secure API endpoints to update the database."
}

## Design Guidelines
{
  "colorScheme": "Neutral Grayscale (Slate/Zinc) with Primary Accent (Indigo)",
  "typography": "Sans-serif (Inter) for UI, Serif (Merriweather) for Blog Content",
  "designSystem": "Tailwind CSS with Radix UI primitives",
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