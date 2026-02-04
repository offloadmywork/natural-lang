@Task
A task has a unique ID, title, description, and completion status.
The ID is auto-generated when a task is created.
Titles are required and must be 1-200 characters.
Descriptions are optional and can be up to 2000 characters.
Tasks start as incomplete by default.

@TaskList
A task list contains multiple tasks.
Tasks can be filtered by completion status (all, complete, incomplete).
Tasks are sorted with incomplete tasks first, then by creation date (newest first).

@CreateTask
Users can create a new task by providing a title and optional description.
The system generates a unique ID and sets the status to incomplete.
The creation timestamp is recorded.
Returns the newly created task.

@UpdateTask
Users can update a task's title or description.
The task must exist, or return an error.
Empty titles are not allowed.
Record the last updated timestamp.

@CompleteTask
Users can mark a task as complete.
The task must exist and be incomplete.
Record the completion timestamp.
Completed tasks cannot be marked complete again (return an error if attempted).

@UncompleteTask
Users can mark a completed task as incomplete.
The task must exist and be complete.
Clear the completion timestamp.

@DeleteTask
Users can delete a task by ID.
The task must exist, or return an error.
Deletion is permanent (no undo).
Show a confirmation before deleting.

@TaskAPI
Expose a REST API with the following endpoints:

GET /tasks — returns all tasks, optionally filtered by status query parameter
GET /tasks/:id — returns a single task by ID, or 404 if not found
POST /tasks — creates a new task with title and description in the body
PUT /tasks/:id — updates a task's title or description
PATCH /tasks/:id/complete — marks a task as complete
PATCH /tasks/:id/uncomplete — marks a task as incomplete
DELETE /tasks/:id — deletes a task

All endpoints return JSON.
Use appropriate HTTP status codes (200, 201, 404, 400, 500).

@Storage
Tasks are stored in memory (use a Map or similar).
In the future, support persistence to a database.

@Validation
All user input must be validated before processing.
Invalid requests return a 400 error with a clear message explaining what's wrong.
Examples of invalid input:
- Missing required fields
- Title too long
- Task ID not found
- Attempting to complete an already completed task

@ErrorHandling
If an operation fails, return a clear error message.
Log errors for debugging.
Never expose internal implementation details in error messages to users.

@WebInterface
Provide a simple web UI that displays the task list and allows users to:
- See all tasks
- Add a new task
- Mark tasks as complete/incomplete
- Delete tasks
- Filter by completion status

The UI should update in real-time when tasks change.
Use a clean, minimal design with good mobile support.
