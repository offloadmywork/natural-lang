# Getting Started with Natural

Welcome to Natural! This guide will walk you through writing your first Natural program and compiling it to a working application.

## Prerequisites

- **Node.js** v16 or higher
- **npm** or **yarn**
- **OpenAI API key** (optional but recommended for best results)

## Installation

Clone the Natural repository and build the project:

```bash
git clone https://github.com/offloadmywork/natural-lang.git
cd natural-lang
npm install
npm run build
```

This builds all packages including the CLI, compiler, and VSCode extension.

## Your First Natural Program

Let's create a simple task management application step-by-step.

### Step 1: Create a .nl file

Create a new file called `tasks.nl`:

```natural
@Task
A task represents a unit of work.
Tasks have a unique ID, title, description, and status.
The status can be "pending", "in_progress", or "completed".
Each task has a created_at timestamp.

@API
Expose a REST API:
GET /tasks — list all tasks
GET /tasks/:id — get a task by ID
POST /tasks — create a new task
PUT /tasks/:id — update a task
DELETE /tasks/:id — delete a task

All endpoints return JSON.
```

### Step 2: Understand the Syntax

Natural programs consist of **@Concepts** (entities, APIs, etc.) written in plain English:

- **`@Task`** - Defines an entity named Task
- **Text under @Concepts** - Natural language description of what the concept is and does
- **`@API`** - Defines the REST API endpoints for your application
- **References** - Use `@TaskName` to reference other concepts

### Step 3: Compile Your Program

#### With AI (Recommended)

Set your OpenAI API key for intelligent code generation:

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

Or use Claude via OpenRouter:

```bash
export NATURAL_LLM_API_KEY="sk-or-v1-your-key"
export NATURAL_LLM_BASE_URL="https://openrouter.ai/api/v1"
export NATURAL_LLM_MODEL="anthropic/claude-3.5-sonnet"
```

Then compile:

```bash
node packages/cli/dist/index.js build tasks.nl -o task-app
```

#### Without AI (Template-based)

Natural falls back to template-based generation if no API key is set:

```bash
node packages/cli/dist/index.js build tasks.nl -o task-app
```

Note: Template-based generation is less sophisticated but works without external dependencies.

### Step 4: Run Your Application

Navigate to the output directory and start the server:

```bash
cd task-app
npm install
npm run dev
```

Your API is now running at http://localhost:3000! 🎉

### Step 5: Test Your API

Try out the endpoints:

```bash
# Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "My first task", "description": "Learn Natural", "status": "pending"}'

# List all tasks
curl http://localhost:3000/tasks

# Get a specific task
curl http://localhost:3000/tasks/1

# Update a task
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# Delete a task
curl -X DELETE http://localhost:3000/tasks/1
```

## Key Concepts

### @Entity Definitions

Define your data models in natural language:

```natural
@User
A user has a unique email, username, and password.
Users can be either regular users or administrators.
Each user has a created_at timestamp.
```

Natural extracts the structure and generates:
- TypeScript interfaces
- Zod validation schemas
- Database models (if specified)

### Relationships

Express relationships naturally:

```natural
@Post
A blog post has a title, content, and author.
Each post belongs to one @User (the author).
Posts can have many @Comment entries.

@Comment
A comment has text and an author.
Each comment belongs to one @Post.
The author is a @User.
```

### @API Specifications

Describe your API endpoints:

```natural
@API
Expose a REST API:
GET /users — list all users with pagination
GET /users/:id — get a user by ID  
POST /users — create a new user (email, username, password)
PUT /users/:id — update user details
DELETE /users/:id — delete a user

All endpoints return JSON.
Use authentication for protected endpoints.
```

The compiler generates Express.js routes with proper:
- HTTP method handling
- Path parameters
- Request validation
- Error handling
- Response formatting

### Authentication & Authorization

Specify security requirements:

```natural
@Authentication
Users must log in with email and password.
Use JWT tokens for authentication.
Tokens expire after 1 hour.

@Authorization
Users can only edit their own posts.
Administrators can edit any post.
```

### Validation

Natural automatically validates inputs based on your descriptions:

```natural
@User
Email must be a valid email format.
Username must be 3-20 characters, alphanumeric only.
Password must be at least 8 characters with letters and numbers.
```

## CLI Reference

```bash
# Build a .nl file to TypeScript
node packages/cli/dist/index.js build <file.nl> [-o output-dir]

# Check a .nl file for errors
node packages/cli/dist/index.js check <file.nl>

# Explain what the compiler understands
node packages/cli/dist/index.js explain <file.nl>

# Initialize a new Natural project (coming soon)
node packages/cli/dist/index.js init [directory]
```

## Next Steps

### 1. Explore Examples

Check out the [`examples/`](../examples) directory for complete applications:

- **`simple.nl`** - Minimal example to learn syntax
- **`todo-app.nl`** - CRUD operations and basic API
- **`blog-platform.nl`** - Complex relationships and authentication
- **`auth.nl`** - Advanced authentication and authorization
- **`chat.nl`** - Real-time features with WebSockets

### 2. Add Complexity

Enhance your application with:

```natural
@Validation
All user input must be validated.
Email addresses must be valid format.
Titles must be 1-200 characters.

@Storage
Store data in PostgreSQL.
Use indexes on frequently queried fields.

@RateLimiting
Limit requests to 100 per minute per IP.

@WebInterface
Provide a responsive web UI for creating and viewing tasks.
```

### 3. Install the VSCode Extension

Get syntax highlighting, diagnostics, and IntelliSense:

```bash
cd packages/vscode
npm run build
npm run package
# Install the generated .vsix file in VSCode
```

### 4. Customize Generated Code

The compiler generates clean, readable TypeScript. You can:
- Modify generated files directly
- Extend with custom logic
- Add additional routes or models
- Integrate with existing codebases

## Tips & Best Practices

### ✅ Do

- **Be specific** - "Email must be unique" is better than "email is special"
- **Use consistent naming** - `@User` not `@Users` or `@user`
- **Reference concepts** - Link related entities with @References
- **Describe constraints** - Character limits, required fields, formats
- **Specify API behavior** - Status codes, error handling, pagination

### ❌ Don't

- **Be vague** - "Some kind of user system" won't generate good code
- **Mix concerns** - Keep @Entity, @API, @Storage separate
- **Forget validation** - Always specify input constraints
- **Skip error handling** - Describe what happens when things go wrong

## Troubleshooting

### Compilation Errors

```bash
# Check your file for syntax errors
node packages/cli/dist/index.js check myapp.nl
```

Common issues:
- **Undefined reference** - You referenced `@Task` but didn't define it
- **Duplicate definition** - You defined `@User` twice
- **Invalid syntax** - Check that @Concepts start with @ and are capitalized

### Generated Code Issues

If the generated code doesn't match your expectations:

1. **Use AI compilation** - Set `OPENAI_API_KEY` for better results
2. **Be more specific** - Add more details to your .nl file
3. **Check examples** - See how similar features are specified
4. **Iterate** - Refine your specification and rebuild

### Need Help?

- **Check examples** - See working .nl files in [`examples/`](../examples)
- **Read the README** - Full documentation in [README.md](../README.md)
- **Open an issue** - Report bugs or request features on GitHub

## What's Generated?

When you compile a .nl file, Natural generates a complete TypeScript project:

```
output/
├── src/
│   ├── types.ts       # TypeScript interfaces for your entities
│   ├── schemas.ts     # Zod validation schemas
│   ├── routes.ts      # Express.js API routes
│   └── index.ts       # Application entry point
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── README.md          # Generated documentation
└── .gitignore
```

All code is:
- **Clean and readable** - Generated code looks hand-written
- **Well-structured** - Follows TypeScript and Express best practices
- **Fully typed** - Complete TypeScript types throughout
- **Validated** - Zod schemas validate all inputs
- **Documented** - Includes inline comments and README

## Ready to Build?

Start with a simple example, then gradually add features:

1. Define your core entities
2. Add API endpoints
3. Specify validation rules
4. Add authentication/authorization
5. Describe storage requirements
6. Request a web interface
7. Deploy!

Natural turns your specifications into working code. Focus on **what** you want, let Natural handle **how** to build it.

Happy coding! 🚀
