# SkillHub - OpenClaw Skills Registry

## Overview
SkillHub is a full-stack platform designed as a "GitHub for OpenClaw Skills," enabling developers to discover, publish, and install AI agent skills. Its primary purpose is to provide a centralized registry with features like skill versioning, validation, search capabilities, user profiles, and a streamlined one-command installation process. The platform aims to foster a community around AI agent development, offering a robust ecosystem for sharing and managing skills.

## User Preferences
I prefer iterative development with a focus on delivering core features first. Please ensure clear communication regarding architectural decisions and significant changes. I value detailed explanations for complex implementations.

## System Architecture
SkillHub is built with a **Node.js + Express.js + TypeScript** backend and a **React 18 + Vite + TypeScript** frontend. **PostgreSQL** with **Drizzle ORM** serves as the database. Authentication is handled via a **custom email/password system** integrated with **Google OAuth**, utilizing **session-based authentication**. The UI/UX is built with **Tailwind CSS** and **shadcn/ui components**, with **Wouter** for client-side routing.

Core architectural patterns include:
- **Modular Monorepo Structure**: Separated `client/`, `server/`, and `shared/` directories for clear domain separation.
- **Skill Definition Format**: Skills are defined using a `SKILL.md` markdown format with YAML frontmatter for metadata.
- **CLI-driven Workflow**: A command-line interface (`shsc`) provides GitHub-like functionality for skill management, including authentication, publishing, installation, and validation.
- **API-First Design**: Comprehensive Web and CLI APIs support all platform functionalities, with token-based authentication and scope enforcement for CLI interactions.
- **Validation Pipeline**: Automated security and best practice checks for published skills.
- **SEO Optimization**: Dynamic meta tag injection, `robots.txt`, `sitemap.xml`, and JSON-LD structured data are implemented for search engine discoverability.
- **AI Integration**: Features for AI-powered skill explanation, generation, and chat, utilizing Bring-Your-Own-Key (BYOK) for OpenAI services.
- **Multi-file Skill Support**: Skills can comprise multiple files, managed through a file browser and ZIP upload/download functionalities, with `.skillignore` for exclusion.
- **Admin Dashboard**: A private dashboard provides activity monitoring and moderation tools for comments and skills, accessible only to administrators.

Key features and implementations:
- **Browse & Discover**: Search and filtering of skills.
- **Publish & Version Control**: Semantic versioning and history for skills.
- **User Profiles**: Public profiles showcasing published skills.
- **Star System**: Users can star/favorite skills.
- **API Tokens**: Scope-based API tokens for CLI authentication.
- **Authentication**: Custom email/password with Google OAuth, session management, and password reset flows.
- **Rate Limiting**: Implemented across various API endpoints to prevent abuse.
- **Comprehensive Error Handling & Validation**: Frontend loading skeletons, robust input validation, and error states.

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Express.js**: Web application framework for the Node.js backend.
- **React 18**: Frontend library for building user interfaces.
- **Vite**: Build tool for the frontend.
- **TypeScript**: Used across both frontend and backend for type safety.
- **Drizzle ORM**: Object-Relational Mapper for database interactions.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **shadcn/ui**: UI component library.
- **Wouter**: Lightweight React router.
- **connect-pg-simple**: PostgreSQL-backed session store.
- **bcrypt**: For password hashing.
- **Google OAuth**: For third-party authentication.
- **OpenAI API**: For AI-powered features (skill explanation, generation, chat), utilizing a BYOK model.