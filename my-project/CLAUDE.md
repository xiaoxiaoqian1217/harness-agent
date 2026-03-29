# Personal Portfolio & Blog Platform - Global Project Specifications

## Project Overview
A full-stack web application designed to showcase professional work and publish technical content. Built with Next.js and SQLite, it offers a seamless experience for visitors to explore projects, read articles, and contact the owner, featuring a responsive design and dark mode support.

## Technology Stack
{
  "frontend": "react-nextjs",
  "backend": null,
  "database": "sqlite",
  "fullStack": "react-nextjs",
  "isSeparate": false
}

## Architecture
{
  "isSeparateFrontendBackend": false,
  "components": [
    "Next.js App Router",
    "SQLite Database Layer",
    "API Route Handlers",
    "Static Page Generator",
    "CMS Content Layer"
  ],
  "dataFlow": "User requests initiate at the Next.js server. Server-side rendering fetches data from SQLite via ORM. Dynamic content (blog posts, projects) is generated on-demand or pre-rendered. API routes handle form submissions and dynamic queries. Responses are sent back to the client for hydration."
}

## Design Guidelines
{
  "colorScheme": "Neutral monochrome base (Slate/Zinc) with a single primary accent color (e.g., Indigo)",
  "typography": "Clean sans-serif typeface (Inter or System UI) with clear hierarchy",
  "designSystem": "Tailwind CSS for utility-first styling",
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