@User
A user represents someone who can participate in chat rooms.
Users have a unique ID (UUID), username (3-20 characters, alphanumeric), display name, avatar URL (optional), and online status.
Online status can be: online, away, busy, or offline.
Users have a created_at timestamp and last_seen timestamp.
Users can set a custom status message (max 100 characters).

@Room
A chat room is a space where users can exchange messages.
Each room has a unique ID, name (required, 1-100 characters), description (optional), type, creation timestamp, and creator.
Room types: public (anyone can join), private (invite-only), direct (1-on-1 conversation).
Public rooms can be discovered and joined by any user.
Private rooms require an invitation from an existing member.
Direct message rooms are automatically created between two users and cannot have additional members.
Rooms track the last message timestamp for sorting.

@Message
Messages are the core communication unit in chat.
Each message has a unique ID, content, sender (User), room, timestamp, edited timestamp (if edited), and message type.
Message types: text, image, file, system (notifications like "User joined").
Text messages support markdown formatting and emoji.
Messages can reference other messages for threading/replies (parent_message_id).
Messages have a read status per user (delivered, read).
Deleted messages are marked as deleted but not removed (content replaced with "[deleted]").
Maximum message length: 10,000 characters.

@Attachment
Messages can include file attachments.
Each attachment has a unique ID, filename, file size, MIME type, storage URL, and upload timestamp.
Supported types: images (jpg, png, gif, webp), documents (pdf, doc, docx), and archives (zip).
Maximum file size: 10 MB per attachment.
Images generate thumbnails automatically.
Attachments are scanned for malware before storage.

@Reaction
Users can react to messages with emoji.
Each reaction records the user, message, emoji (unicode), and timestamp.
Users can only react once per emoji per message.
Popular reactions: 👍, ❤️, 😂, 🔥, 🎉.
Reactions are grouped and counted per message.

@Membership
Membership tracks which users belong to which rooms.
Each membership has a user, room, role (owner, admin, member), join timestamp, and last_read_message_id.
Roles determine permissions within the room:
- Owner: can delete room, manage all settings, assign/remove admins
- Admin: can invite/remove members, manage room settings, pin messages
- Member: can send messages, react, upload attachments
Users can leave rooms they're members of.
Owners can transfer ownership to another member.

@Presence
Presence indicates user online status and current activity.
Track user ID, online status, last active timestamp, current room (if any), and typing status.
Typing indicators show when a user is composing a message in a room.
Typing status expires after 5 seconds of inactivity.
Presence updates are broadcast to all users in shared rooms.

@Notification
Notifications alert users to important events.
Each notification has a unique ID, recipient, type, content, timestamp, and read status.
Notification types: mention (@ mentions), reply (direct replies), room_invite, direct_message.
Users can configure notification preferences per room (all messages, mentions only, muted).
Unread notification counts are shown in the UI.
Notifications expire after 30 days.

@ReadReceipt
Read receipts track when users read messages.
Each receipt records user, message, and read timestamp.
Displayed as "Read by X users" in group chats.
In direct messages, show "Delivered" and "Read" status.
Users can see who read their messages in group chats.

@Invite
Invites allow users to join private rooms.
Each invite has a unique code (short alphanumeric string), room, creator, creation timestamp, expiration, and usage limit.
Invites can be single-use or multi-use.
Default expiration: 7 days.
Invites can be revoked by room admins.

@API
Expose a REST API and WebSocket interface:

REST Endpoints:
POST /auth/login — authenticate and receive token
GET /auth/me — get current user info

GET /rooms — list user's rooms (sorted by last message)
GET /rooms/public — discover public rooms
GET /rooms/:id — get room details
POST /rooms — create new room (name, description, type)
PUT /rooms/:id — update room (requires admin)
DELETE /rooms/:id — delete room (requires owner)
POST /rooms/:id/join — join public room
POST /rooms/:id/leave — leave room

GET /rooms/:id/messages — get messages with pagination (limit, before/after message ID)
POST /rooms/:id/messages — send message
PUT /messages/:id — edit message (must be sender, within 15 minutes)
DELETE /messages/:id — delete message (must be sender or room admin)
POST /messages/:id/reactions — add reaction to message
DELETE /messages/:id/reactions/:emoji — remove reaction

GET /rooms/:id/members — list room members
POST /rooms/:id/members — invite user to room (requires admin)
DELETE /rooms/:id/members/:userId — remove member (requires admin)
PATCH /rooms/:id/members/:userId/role — change member role (requires owner)

POST /rooms/:id/invites — create invite link (requires admin)
GET /invites/:code — get invite details
POST /invites/:code/accept — join room via invite
DELETE /invites/:code — revoke invite (requires admin)

GET /users/:id — get user profile
GET /users/search?q=username — search users
PATCH /users/me — update own profile (display name, avatar, status)

GET /notifications — list notifications for current user
PATCH /notifications/:id/read — mark notification as read
PATCH /notifications/read-all — mark all as read

POST /attachments/upload — upload file, returns attachment ID
GET /attachments/:id — download attachment

WebSocket Events (wss://api/ws):
Connected clients subscribe to room channels.

Client → Server:
- join_room: { room_id } — subscribe to room updates
- leave_room: { room_id } — unsubscribe from room
- typing_start: { room_id } — indicate typing
- typing_stop: { room_id } — stop typing indicator
- send_message: { room_id, content, parent_id?, attachments? } — send message
- read_message: { message_id } — mark message as read

Server → Client:
- message_created: { room_id, message } — new message in subscribed room
- message_updated: { room_id, message } — message edited
- message_deleted: { room_id, message_id } — message deleted
- reaction_added: { message_id, user, emoji } — reaction added
- reaction_removed: { message_id, user, emoji } — reaction removed
- user_typing: { room_id, user_id } — user is typing
- user_joined: { room_id, user } — user joined room
- user_left: { room_id, user_id } — user left room
- presence_updated: { user_id, status } — user status changed
- notification: { notification } — new notification for user

All REST endpoints return JSON.
WebSocket messages are JSON-formatted.
Use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500).

@Authentication
Require authentication for all endpoints except login.
Use JWT tokens for REST API authentication.
WebSocket connections authenticate via token in initial handshake.
Tokens expire after 24 hours.

@Authorization
Users can only access rooms they're members of.
Direct messages are private between the two participants.
Room admins can manage members and settings.
Room owners have full control including deletion.
Users can only edit/delete their own messages (except admins).

@RealTime
Use WebSockets for real-time message delivery and presence.
Broadcast message events to all room members instantly.
Implement automatic reconnection with exponential backoff.
Queue messages during disconnect and send when reconnected.
Show connection status in UI (connected, connecting, disconnected).

@Storage
Store messages in PostgreSQL with full-text search indexing.
Cache recent messages (last 100 per room) in Redis for fast delivery.
Store uploaded files in object storage (S3-compatible).
Index messages by room and timestamp for pagination.
Store presence data in Redis (expires after 5 minutes of inactivity).

@Search
Implement full-text search across message content.
Search within specific rooms or across all rooms user has access to.
Support filters: sender, date range, has:attachments, has:links.
Highlight search terms in results.
Return messages with context (previous and next message).

@Validation
Validate all inputs:
- Room name: 1-100 characters
- Username: 3-20 characters, alphanumeric and underscores
- Message content: 1-10,000 characters
- Display name: 1-50 characters
- Status message: max 100 characters

Sanitize message content to prevent XSS.
Validate file uploads for type and size.
Rate limit message sending (max 10 messages per 10 seconds per user).

@Moderation
Room admins can delete any message in their rooms.
Implement user blocking (blocked users can't send direct messages).
Report messages for review.
Mute users in specific rooms (they can see but not send messages).
Flag and queue reported content for admin review.

@WebInterface
Provide a responsive web UI with:
- Room list sidebar with unread indicators
- Message timeline with infinite scroll
- Real-time message updates
- Typing indicators
- Read receipts
- Emoji picker for reactions
- Drag-and-drop file upload
- User profile panels
- Search interface
- Notification center

Support desktop notifications for mentions and direct messages.
Keyboard shortcuts for navigation and actions.
Dark mode support.
Mobile-responsive layout.
