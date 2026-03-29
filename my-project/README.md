# Personal Portfolio & Blog Platform

A full-stack personal website built with Next.js and SQLite, featuring a responsive design, content management system, and SEO-optimized blog functionality.

## Features

- **Next.js App Router**: Server-side rendering and static generation for optimal performance.
- **SQLite Database**: Lightweight, serverless database solution.
- **Prisma ORM**: Type-safe database access.
- **Responsive Design**: Built with Tailwind CSS.
- **Blog Engine**: Dynamic routing for blog posts with SEO metadata.
- **Admin Dashboard**: Protected route for content management.

## Tech Stack

- **Frontend**: React, Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: SQLite
- **ORM**: Prisma
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd personal-portfolio-blog
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env` to `.env.local` and configure as needed.

4. Initialize the database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run db:generate`: Generate Prisma Client
- `npm run db:migrate`: Run database migrations
- `npm run db:push`: Push schema changes to database

## License

MIT