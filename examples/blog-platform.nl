@User
A user represents someone who can write and read blog posts.
Users have a unique ID (auto-generated UUID), username (3-20 characters, alphanumeric), email, password hash, and display name.
Usernames must be unique across the system.
Users can be either regular users or administrators.

@Post
A blog post has a unique ID, title, content, author, creation timestamp, last updated timestamp, and published status.
The title is required and must be 1-200 characters.
Content is required and supports markdown formatting.
Posts can be in draft or published state.
Each post belongs to exactly one author (User).
Posts can have multiple tags and categories.

@Tag
A tag is a keyword for organizing posts.
Tags have a unique name (lowercase, alphanumeric with hyphens).
Tags can be applied to multiple posts.
Popular tags should be suggested when creating posts.

@Category
Categories are hierarchical groupings for posts.
Each category has a name, slug (URL-friendly), and optional parent category.
Posts can belong to multiple categories.

@Comment
Users can leave comments on published posts.
Comments have an ID, author, content (1-2000 characters), timestamp, and can be replies to other comments (nested threading).
Comments must be approved by administrators before appearing publicly if the post author enables moderation.

@Like
Users can like posts and comments.
Each user can only like a specific post or comment once.
Track the timestamp of when the like was created.

@SearchIndex
The system must support full-text search across post titles and content.
Search should rank results by relevance and recency.
Searches can be filtered by author, tags, categories, and date range.

@Authentication
Users must log in with email and password.
Implement JWT-based authentication with access and refresh tokens.
Access tokens expire after 1 hour, refresh tokens after 30 days.
Password reset via email with time-limited tokens.

@Authorization
Regular users can create, edit, and delete their own posts and comments.
Administrators can edit or delete any post or comment.
Administrators can manage users (suspend, delete).
Unpublished posts are only visible to their authors and administrators.

@API
Expose a REST API with the following endpoints:

POST /auth/register — register a new user (email, username, password)
POST /auth/login — login and receive tokens
POST /auth/refresh — refresh access token
POST /auth/logout — invalidate refresh token

GET /posts — list all published posts with pagination (limit, offset) and filters (author, tag, category)
GET /posts/:id — get a single post by ID
POST /posts — create a new post (requires authentication)
PUT /posts/:id — update a post (requires authentication, must be author or admin)
DELETE /posts/:id — delete a post (requires authentication, must be author or admin)
PATCH /posts/:id/publish — publish a draft post

GET /posts/:id/comments — get all comments for a post
POST /posts/:id/comments — add a comment to a post (requires authentication)
DELETE /comments/:id — delete a comment (requires authentication, must be author or admin)

POST /posts/:id/like — like a post (requires authentication)
DELETE /posts/:id/like — unlike a post (requires authentication)

GET /tags — list all tags
GET /tags/:name/posts — get all posts with a specific tag

GET /categories — list all categories (hierarchical structure)
GET /categories/:slug/posts — get all posts in a category

GET /search?q=query&author=&tag=&category=&from=&to= — search posts

GET /users/:username — get public user profile (display name, bio, post count)
GET /users/:username/posts — list user's published posts

All endpoints return JSON.
Use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500).
Implement rate limiting (100 requests per minute per IP for public endpoints, 1000 for authenticated).

@Storage
Store data in a database (PostgreSQL recommended for production).
Use proper indexes for performance (on user email/username, post author, tags, categories).
Implement soft deletes for posts and comments (mark as deleted instead of removing).

@Validation
All user input must be validated before processing.
Sanitize markdown content to prevent XSS attacks.
Validate email formats, username characters, password strength (min 8 chars, must include letters and numbers).
Return clear validation error messages.

@WebInterface
Provide a responsive web UI that displays:
- Homepage with recent posts and popular tags
- Individual post pages with comments
- User profile pages
- Post creation and editing forms (markdown editor with preview)
- Search interface
- Login/register forms

Use a clean, readable design optimized for long-form content.
Mobile-responsive layout.
Syntax highlighting for code blocks in markdown.