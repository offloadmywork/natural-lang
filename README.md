# Natural Language Programming

Natural is a programming language where you write specifications in natural language, and an agentic compiler turns them into working software.

## 🎯 Core Value Proposition

Write what you want in plain English, and Natural's AI compiler generates production-ready TypeScript code.

## Project Structure

- **packages/core/** - Parser for .nl files (extracts concepts and structure)
- **packages/compiler/** - Agentic AI-powered code generator (.nl → TypeScript)
- **packages/cli/** - Command-line interface (`natural build`)
- **packages/lsp/** - Language Server Protocol implementation
- **packages/vscode/** - VSCode extension

## Features

### Editor Support (VSCode Extension)
- **Syntax highlighting** for @Concepts
- **Static analysis** - undefined references, duplicate definitions
- **LLM-powered analysis** - contradictions, ambiguities, suggestions (optional)
- **Hover info** - see concept definitions
- **Go to definition** - jump to concept definitions

### AI-Powered Compilation
- **Agentic compiler** - Uses LLM to understand your natural language specs and generate working code
- **Intelligent code generation** - Creates TypeScript interfaces, Zod schemas, Express APIs, and web UIs
- **Template fallback** - Works without AI (using heuristics) if no API key is provided
- **Multiple LLM providers** - Compatible with OpenAI, Claude, or any OpenAI-compatible API

## Quick Start

### 1. Installation

```bash
git clone https://github.com/offloadmywork/natural-lang.git
cd natural-lang
npm install
npm run build
```

### 2. Create Your First Natural Program

Create a file called `my-app.nl`:

```
@Task
A task has a unique ID, title, and completion status.
Users can create, update, and delete tasks.

@API
Expose a REST API:
GET /tasks — list all tasks
POST /tasks — create a task
DELETE /tasks/:id — delete a task

All endpoints return JSON.
```

### 3. Compile with AI (Recommended)

Set your OpenAI API key:

```bash
export OPENAI_API_KEY="sk-..."
# Or use Claude via OpenRouter:
export NATURAL_LLM_API_KEY="sk-..."
export NATURAL_LLM_BASE_URL="https://openrouter.ai/api/v1"
export NATURAL_LLM_MODEL="anthropic/claude-3.5-sonnet"
```

Then compile:

```bash
node packages/cli/dist/index.js build my-app.nl -o output
cd output
npm install
npm run dev
```

Your API is now running on http://localhost:3000! 🎉

### 4. Without AI (Template-Based Fallback)

If you don't set an API key, Natural falls back to template-based code generation:

```bash
node packages/cli/dist/index.js build my-app.nl -o output
```

This works but produces less sophisticated code. AI compilation is strongly recommended for production use.

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Watch mode (for development)
npm run dev
```

## VSCode Extension

```bash
cd packages/vscode
npm run build
npm run package  # Creates .vsix file
```

Install the extension:
1. Open VSCode
2. Go to Extensions (Cmd+Shift+X)
3. Click "..." menu → "Install from VSIX..."
4. Select the generated .vsix file

## CLI Commands

```bash
# Initialize a new Natural project
natural init [directory]

# Check a .nl file for errors
natural check app.nl

# Compile a .nl file to TypeScript
natural build app.nl [-o output-dir]

# Explain what the compiler understands
natural explain app.nl
```

### CLI Usage Examples

```bash
# Compile an example and run it
node packages/cli/dist/index.js build examples/todo-app.nl -o my-todo-app
cd my-todo-app
npm install
npm run dev

# Check an example for errors without building
node packages/cli/dist/index.js check examples/blog-platform.nl

# See how the compiler interprets your specification
node packages/cli/dist/index.js explain examples/auth.nl

# Build with a custom output directory
node packages/cli/dist/index.js build examples/chat.nl -o ~/projects/chat-backend
```

## Examples

The [`examples/`](./examples) directory contains complete sample programs demonstrating Natural's capabilities. Each example is a fully-specified application ready to compile and run.

### 📋 **[simple.nl](./examples/simple.nl)** - Getting Started
The simplest possible Natural program. Demonstrates basic @Entity definitions and concept relationships. Perfect for learning the syntax.

**Key Concepts:** @User, @Task, @Status, @Admin  
**Complexity:** Beginner  
**Features:** Basic entity modeling, enumerations, user roles

---

### ✅ **[todo-app.nl](./examples/todo-app.nl)** - Task Management
A complete task management API with CRUD operations, user authentication, and task categorization.

**Key Concepts:** @Task, @User, @Category, @API  
**Complexity:** Beginner → Intermediate  
**Features:** RESTful API, validation, authentication, CRUD operations

**Try it:**
```bash
node packages/cli/dist/index.js build examples/todo-app.nl -o todo-app
cd todo-app && npm install && npm run dev
```

---

### 📝 **[blog-platform.nl](./examples/blog-platform.nl)** - Content Publishing
A full-featured blogging platform with posts, comments, tags, categories, search, and JWT authentication.

**Key Concepts:** @User, @Post, @Comment, @Tag, @Category, @Like, @SearchIndex, @Authentication, @Authorization  
**Complexity:** Intermediate → Advanced  
**Features:**
- Multi-user publishing with roles (user, admin)
- Nested comments with threading
- Full-text search across posts
- Tag and category hierarchies
- Social features (likes, follows)
- JWT authentication with refresh tokens
- Markdown support with XSS protection
- Rate limiting and security features

**Try it:**
```bash
node packages/cli/dist/index.js build examples/blog-platform.nl -o blog
cd blog && npm install && npm run dev
```

---

### 🔐 **[auth.nl](./examples/auth.nl)** - Authentication & Authorization
A comprehensive authentication and authorization system with users, sessions, roles, permissions, and audit logging.

**Key Concepts:** @User, @Role, @Permission, @Session, @PasswordReset, @EmailVerification, @AuditLog, @RateLimiter  
**Complexity:** Advanced  
**Features:**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC) with granular permissions
- Email verification and password reset flows
- Session management with device tracking
- Security audit logs
- Rate limiting and account lockout protection
- Multi-session support
- API key authentication for services

**Use Cases:** Add authentication to any application, microservice IAM, admin panels

**Try it:**
```bash
node packages/cli/dist/index.js build examples/auth.nl -o auth-service
cd auth-service && npm install && npm run dev
```

---

### 💬 **[chat.nl](./examples/chat.nl)** - Real-time Messaging
A real-time chat application with rooms, direct messages, presence, typing indicators, and file attachments.

**Key Concepts:** @User, @Room, @Message, @Attachment, @Reaction, @Membership, @Presence, @Notification, @ReadReceipt, @Invite  
**Complexity:** Advanced  
**Features:**
- WebSocket-based real-time messaging
- Public, private, and direct message rooms
- Message threading and replies
- File attachments with previews
- Emoji reactions
- Typing indicators and presence
- Read receipts
- Room invitations and permissions
- Full-text message search
- User blocking and moderation
- Desktop notifications

**Use Cases:** Team collaboration, customer support chat, community forums

**Try it:**
```bash
node packages/cli/dist/index.js build examples/chat.nl -o chat-app
cd chat-app && npm install && npm run dev
```

---

### 🛒 **[ecommerce-catalog.nl](./examples/ecommerce-catalog.nl)** - E-commerce Backend
A product catalog system with inventory management, shopping cart, and order processing.

**Key Concepts:** @Product, @Category, @Variant, @Inventory, @Cart, @Order  
**Complexity:** Intermediate  
**Features:** Product variants, inventory tracking, shopping cart, checkout flow

**Try it:**
```bash
node packages/cli/dist/index.js build examples/ecommerce-catalog.nl -o ecommerce
cd ecommerce && npm install && npm run dev
```

---

### 🔗 **[url-shortener.nl](./examples/url-shortener.nl)** - Link Shortening Service
A URL shortening service with analytics, QR codes, and custom aliases.

**Key Concepts:** @ShortURL, @Click, @Analytics, @QRCode  
**Complexity:** Intermediate  
**Features:** Custom aliases, click tracking, QR code generation, link expiration, analytics dashboard

**Try it:**
```bash
node packages/cli/dist/index.js build examples/url-shortener.nl -o url-short
cd url-short && npm install && npm run dev
```

---

### 💡 Learning Path

1. **Start with `simple.nl`** - Learn the basic syntax and @Entity definitions
2. **Try `todo-app.nl`** - Understand @API endpoints and CRUD operations
3. **Explore `blog-platform.nl`** - See complex relationships and authentication
4. **Study `auth.nl`** - Learn security patterns and permission systems
5. **Build with `chat.nl`** - Master real-time features and WebSockets
6. **Create your own!** - Combine patterns from examples to build your application

Each example compiles to a complete, runnable TypeScript application with API routes, validation, and documentation.

## How It Works

1. **Parse**: The parser extracts @Concepts and their descriptions from your .nl file
2. **Analyze**: Static analysis checks for errors (undefined references, duplicates)
3. **Generate**: The AI compiler reads your specifications and generates:
   - TypeScript interfaces for your data models
   - Zod validation schemas
   - Express.js API routes with proper error handling
   - Storage layer (in-memory or database)
   - Web UI (if specified)
   - Complete project configuration (package.json, tsconfig.json, etc.)

## Editor Integration (VSCode)

Install the Natural VSCode extension for the best experience:

```bash
cd packages/vscode
npm run build
npm run package
# Install the generated .vsix file in VSCode
```

The extension provides:
- Syntax highlighting for @Concepts
- Real-time diagnostics
- Hover information
- Go-to-definition
- Optional AI-powered semantic analysis
