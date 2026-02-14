@User is a person who interacts with the application.

The @User can create, read, update, and delete @Task items.

@Task represents a unit of work with a title, description, and status.

Each @Task has a @Status which can be "pending", "in progress", or "completed".

@Status is an enumeration representing the current state of a @Task.

@System validates all @User input before processing.

@Admin is a special type of @User with elevated privileges.

An @Admin can manage other @User accounts and view system logs.
