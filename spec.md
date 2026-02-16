# Real-Time Task Collaboration Platform

> A lightweight Trello/Notion hybrid for collaborative task management

##  Project Overview

This project is a **Real-Time Task Collaboration Platform** that enables multiple users to collaboratively manage boards, lists, and tasks with instant updates.

### Core Features

-  User authentication & authorization
-  Board and list creation
-  Task management (CRUD operations)
-  Drag-and-drop task movement
-  Task assignment to team members
-  Real-time synchronization across clients
-  Activity tracking and audit logs
-  Search functionality with pagination
-  Paginated data loading

### Purpose

The platform demonstrates full-stack engineering capabilities including:
- System architecture design
- Real-time communication systems
- Database modeling and optimization
- Scalable backend development
- Modern frontend patterns

---

##  System Architecture

### High-Level Architecture

```
┌─────────────────────┐
│   Client (React)    │
│                     │
└──────────┬──────────┘
           │
           │ REST API
           │ WebSocket
           ▼
┌─────────────────────┐
│  Backend (Node.js)  │
│   Express + WS      │
└──────────┬──────────┘
           │
           │ SQL Queries
           ▼
┌─────────────────────┐
│ PostgreSQL Database │
└─────────────────────┘
```

### Technology Stack

**Frontend:**
- React (Single Page Application)
- Redux Toolkit / Zustand for state management
- React Router for navigation
- react-beautiful-dnd / dnd-kit for drag & drop
- Axios for HTTP requests
- Socket.io-client for WebSocket

**Backend:**
- Node.js + Express.js
- PostgreSQL database
- Prisma / TypeORM / Sequelize ORM
- JWT for authentication
- Socket.io for real-time communication

---

##  Frontend Architecture

### Folder Structure

```
src/
├── app/                    # Redux store configuration
├── features/               # Feature-based modules
│   ├── auth/              # Authentication logic
│   ├── boards/            # Board management
│   ├── lists/             # List management
│   ├── tasks/             # Task management
│   └── activity/          # Activity feed
├── components/            # Reusable UI components
│   ├── common/           # Shared components
│   ├── layout/           # Layout components
│   └── ui/               # UI primitives
├── hooks/                 # Custom React hooks
├── services/              # API & WebSocket services
│   ├── api.js            # HTTP client setup
│   ├── websocket.js      # WebSocket connection
│   └── endpoints/        # API endpoint definitions
├── routes/                # Route configuration
├── utils/                 # Helper functions
└── constants/             # App constants
```

### State Management Strategy

**Global State (Redux/Zustand):**
- Authenticated user information
- Current board data
- Lists and tasks
- WebSocket connection status
- Activity feed

**Local State (Component):**
- Modal visibility
- Form inputs and validation
- Drag state during drag operations
- UI toggles and flags

**Real-time Updates:**
- WebSocket events directly update the Redux/Zustand store
- Optimistic UI updates for better UX
- Conflict resolution for concurrent edits

---

##  Backend Architecture

### Folder Structure

```
src/
├── controllers/           # Request handlers
│   ├── authController.js
│   ├── boardController.js
│   ├── listController.js
│   └── taskController.js
├── services/              # Business logic
│   ├── authService.js
│   ├── boardService.js
│   └── taskService.js
├── routes/                # API route definitions
│   ├── auth.routes.js
│   ├── board.routes.js
│   └── task.routes.js
├── middleware/            # Express middleware
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   └── errorHandler.js
├── models/                # Database models (ORM)
├── websocket/             # WebSocket handlers
│   ├── connection.js
│   └── events/
├── utils/                 # Utility functions
├── validators/            # Request validation schemas
└── config/                # Configuration files
    ├── database.js
    └── jwt.js
```

### Layered Architecture

1. **Routes Layer** → Defines API endpoints
2. **Controller Layer** → Handles HTTP request/response
3. **Service Layer** → Contains business logic
4. **Data Access Layer** → ORM/database queries
5. **WebSocket Layer** → Real-time event broadcasting

### Design Principles

- Separation of concerns
- Dependency injection
- Single responsibility
- Error handling at each layer

---

##  Database Schema Design

### Entity-Relationship Diagram

```
User ──< BoardMember >── Board
                           │
                           ├──< List ──< Task >── TaskAssignment >── User
                           │
                           └──< Activity
```

### Entities

#### **User**
```sql
id              UUID PRIMARY KEY
name            VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### **Board**
```sql
id          UUID PRIMARY KEY
title       VARCHAR(255) NOT NULL
description TEXT
owner_id    UUID REFERENCES User(id) ON DELETE CASCADE
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

#### **BoardMember**
```sql
id          UUID PRIMARY KEY
board_id    UUID REFERENCES Board(id) ON DELETE CASCADE
user_id     UUID REFERENCES User(id) ON DELETE CASCADE
role        ENUM('admin', 'member') DEFAULT 'member'
joined_at   TIMESTAMP DEFAULT NOW()

UNIQUE(board_id, user_id)
```

#### **List**
```sql
id          UUID PRIMARY KEY
title       VARCHAR(255) NOT NULL
board_id    UUID REFERENCES Board(id) ON DELETE CASCADE
position    INTEGER NOT NULL
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()

INDEX idx_list_board (board_id)
INDEX idx_list_position (board_id, position)
```

#### **Task**
```sql
id          UUID PRIMARY KEY
title       VARCHAR(500) NOT NULL
description TEXT
list_id     UUID REFERENCES List(id) ON DELETE CASCADE
position    INTEGER NOT NULL
due_date    TIMESTAMP
created_by  UUID REFERENCES User(id) ON DELETE SET NULL
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()

INDEX idx_task_list (list_id)
INDEX idx_task_position (list_id, position)
INDEX idx_task_due_date (due_date)
```

#### **TaskAssignment**
```sql
id          UUID PRIMARY KEY
task_id     UUID REFERENCES Task(id) ON DELETE CASCADE
user_id     UUID REFERENCES User(id) ON DELETE CASCADE
assigned_at TIMESTAMP DEFAULT NOW()

UNIQUE(task_id, user_id)
```

#### **Activity**
```sql
id          UUID PRIMARY KEY
board_id    UUID REFERENCES Board(id) ON DELETE CASCADE
task_id     UUID REFERENCES Task(id) ON DELETE SET NULL
user_id     UUID REFERENCES User(id) ON DELETE SET NULL
action_type VARCHAR(50) NOT NULL
metadata    JSONB
created_at  TIMESTAMP DEFAULT NOW()

INDEX idx_activity_board (board_id)
INDEX idx_activity_created (created_at DESC)
```

### Indexing Strategy

**Critical Indexes:**
- `user.email` (UNIQUE) - Login queries
- `board.owner_id` - User's boards lookup
- `list.board_id` - Board's lists lookup
- `task.list_id` - List's tasks lookup
- `activity.board_id` - Activity feed queries
- `task.position`, `list.position` - Ordering
- `task.due_date` - Due date filtering

---

##  API Contract Design

### Base URL
```
Production: https://api.taskflow.com/api/v1
Development: http://localhost:5000/api/v1
```

### Authentication Endpoints

#### **POST** `/auth/signup`
Register a new user

**Request:**
```json
{
  "name": "Mani Kumar",
  "email": "mani@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "name": "Mani Kumar",
      "email": "mani@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

#### **POST** `/auth/login`
Authenticate existing user

**Request:**
```json
{
  "email": "mani@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

#### **GET** `/auth/me`
Get current user (requires authentication)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

---

### Board Endpoints

#### **GET** `/boards`
Get all boards for authenticated user

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "boards": [
      {
        "id": "uuid",
        "title": "Project Alpha",
        "description": "Main project board",
        "owner": { "id": "uuid", "name": "Mani" },
        "members_count": 5,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

#### **POST** `/boards`
Create a new board

**Request:**
```json
{
  "title": "New Project Board",
  "description": "Board description"
}
```

**Response:** `201 Created`

#### **GET** `/boards/:id`
Get board details with lists and tasks

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "board": {
      "id": "uuid",
      "title": "Project Alpha",
      "lists": [
        {
          "id": "list-uuid",
          "title": "To Do",
          "position": 0,
          "tasks": [
            {
              "id": "task-uuid",
              "title": "Task 1",
              "description": "Description",
              "position": 0,
              "due_date": "2024-02-01T00:00:00Z",
              "assigned_to": [
                { "id": "user-uuid", "name": "John" }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

#### **PATCH** `/boards/:id`
Update board details

#### **DELETE** `/boards/:id`
Delete a board

---

### List Endpoints

#### **POST** `/boards/:boardId/lists`
Create a new list in a board

**Request:**
```json
{
  "title": "In Progress",
  "position": 1
}
```

**Response:** `201 Created`

#### **PATCH** `/lists/:id`
Update list title or position

**Request:**
```json
{
  "title": "Completed",
  "position": 2
}
```

#### **DELETE** `/lists/:id`
Delete a list and all its tasks

---

### Task Endpoints

#### **POST** `/lists/:listId/tasks`
Create a new task in a list

**Request:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT-based authentication",
  "position": 0,
  "due_date": "2024-02-15T23:59:59Z"
}
```

**Response:** `201 Created`

#### **PATCH** `/tasks/:id`
Update task details

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "due_date": "2024-03-01T23:59:59Z"
}
```

#### **DELETE** `/tasks/:id`
Delete a task

#### **PATCH** `/tasks/:id/move`
Move task to different list or position

**Request:**
```json
{
  "list_id": "new-list-uuid",
  "position": 2
}
```

---

### Assignment Endpoints

#### **POST** `/tasks/:id/assign`
Assign user to a task

**Request:**
```json
{
  "user_id": "user-uuid"
}
```

#### **DELETE** `/tasks/:id/assign/:userId`
Unassign user from a task

---

### Activity Endpoints

#### **GET** `/boards/:id/activity`
Get activity feed for a board

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `action_type` (optional filter)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "uuid",
        "action_type": "task_created",
        "user": { "id": "uuid", "name": "Mani" },
        "task": { "id": "uuid", "title": "New Task" },
        "metadata": {},
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### Search Endpoints

#### **GET** `/search`
Search across boards, lists, and tasks

**Query Parameters:**
- `query` (required) - Search term
- `board_id` (optional) - Limit to specific board
- `type` (optional) - Filter by entity type (board/list/task)
- `page` (default: 1)
- `limit` (default: 20)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "task",
        "id": "uuid",
        "title": "Login implementation",
        "board": { "id": "uuid", "title": "Project Alpha" },
        "list": { "id": "uuid", "title": "In Progress" }
      }
    ],
    "pagination": { ... }
  }
}
```

---

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

---

##  Real-Time Synchronization

### WebSocket Events

#### Client → Server Events

```javascript
// Join board room
socket.emit('join_board', { board_id: 'uuid' });

// Leave board room
socket.emit('leave_board', { board_id: 'uuid' });

// Task operations (optional, handled via REST + broadcast)
socket.emit('task_created', { task: {...} });
socket.emit('task_updated', { task_id: 'uuid', changes: {...} });
socket.emit('task_moved', { task_id: 'uuid', list_id: 'uuid', position: 2 });
```

#### Server → Client Events

```javascript
// Board updates
socket.on('board_updated', (data) => {
  // data: { board_id, changes }
});

// Task events
socket.on('task_created', (data) => {
  // data: { task, list_id }
});

socket.on('task_updated', (data) => {
  // data: { task_id, changes }
});

socket.on('task_deleted', (data) => {
  // data: { task_id, list_id }
});

socket.on('task_moved', (data) => {
  // data: { task_id, from_list, to_list, position }
});

// Activity logged
socket.on('activity_logged', (data) => {
  // data: { activity }
});

// User presence
socket.on('user_joined', (data) => {
  // data: { user, board_id }
});

socket.on('user_left', (data) => {
  // data: { user_id, board_id }
});
```

### Real-Time Flow Example

```
1. User A moves task from "To Do" to "In Progress"
   ↓
2. Client sends PATCH /api/tasks/:id/move
   ↓
3. Backend validates & updates database
   ↓
4. Backend emits WebSocket event to board room
   socket.to(board_id).emit('task_moved', {...})
   ↓
5. All connected clients receive event
   ↓
6. Clients update their local state/Redux store
   ↓
7. UI re-renders with new task position
```

### Connection Management

```javascript
// Client-side connection
const socket = io('wss://api.taskflow.com', {
  auth: {
    token: jwtToken
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Server-side authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});
```

---

##  Drag and Drop Implementation

### Frontend Flow

```javascript
// Using react-beautiful-dnd
const onDragEnd = (result) => {
  if (!result.destination) return;
  
  const { source, destination, draggableId } = result;
  
  // 1. Optimistically update UI
  dispatch(moveTaskOptimistic({
    taskId: draggableId,
    sourceListId: source.droppableId,
    destListId: destination.droppableId,
    sourceIndex: source.index,
    destIndex: destination.index
  }));
  
  // 2. Send API request
  try {
    await api.patch(`/tasks/${draggableId}/move`, {
      list_id: destination.droppableId,
      position: destination.index
    });
  } catch (error) {
    // 3. Rollback on error
    dispatch(moveTaskRollback());
  }
};
```

### Backend Position Recalculation

```javascript
// When moving task
async function moveTask(taskId, newListId, newPosition) {
  const task = await Task.findById(taskId);
  
  if (task.list_id === newListId) {
    // Same list - reorder
    await reorderTasksInList(newListId, task.position, newPosition);
  } else {
    // Different list - move and reorder both
    await removeTaskFromList(task.list_id, task.position);
    await insertTaskIntoList(newListId, newPosition);
  }
  
  task.list_id = newListId;
  task.position = newPosition;
  await task.save();
  
  // Broadcast to all clients
  io.to(task.board_id).emit('task_moved', {
    task_id: taskId,
    from_list: task.list_id,
    to_list: newListId,
    position: newPosition
  });
}
```

---

##  Pagination Strategy

### Implementation Pattern

**Query Parameters:**
- `page` - Current page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Calculation:**
```javascript
const offset = (page - 1) * limit;
const total = await Model.count(whereClause);
const totalPages = Math.ceil(total / limit);
```

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

**Applied to:**
- Activity history feed
- Board listing
- Search results
- Task comments (future feature)

---

##  Testing Strategy

### Frontend Testing

**Unit Tests (Jest + React Testing Library):**
```javascript
// Component rendering
test('renders board with correct title', () => {
  render(<Board title="Test Board" />);
  expect(screen.getByText('Test Board')).toBeInTheDocument();
});

// User interactions
test('opens task modal on click', () => {
  render(<TaskCard task={mockTask} />);
  fireEvent.click(screen.getByText('Task Title'));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

**Integration Tests:**
- Drag and drop behavior
- Form submissions
- Real-time updates
- API error handling

**E2E Tests (Cypress/Playwright):**
- Complete user flows
- Authentication flows
- Board creation to task completion

### Backend Testing

**Unit Tests (Jest):**
```javascript
describe('TaskService', () => {
  test('createTask should create new task', async () => {
    const task = await taskService.create({
      title: 'Test Task',
      list_id: 'list-123'
    });
    expect(task).toHaveProperty('id');
    expect(task.title).toBe('Test Task');
  });
});
```

**Integration Tests (Supertest):**
```javascript
describe('POST /api/tasks', () => {
  test('should create task with valid data', async () => {
    const response = await request(app)
      .post('/api/lists/list-123/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Task' })
      .expect(201);
    
    expect(response.body.data.task).toHaveProperty('id');
  });
});
```

**WebSocket Testing:**
```javascript
test('should broadcast task_created event', (done) => {
  const clientSocket = io('http://localhost:5000');
  
  clientSocket.on('task_created', (data) => {
    expect(data).toHaveProperty('task');
    clientSocket.close();
    done();
  });
  
  // Trigger task creation
});
```

---

##  Deployment Strategy

### Frontend Deployment

**Platform:** Vercel / Netlify

**Build Configuration:**
```json
{
  "build": {
    "command": "npm run build",
    "publish": "build"
  },
  "env": {
    "REACT_APP_API_URL": "@api-url",
    "REACT_APP_WS_URL": "@ws-url"
  }
}
```

**Environment Variables:**
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_WS_URL` - WebSocket server URL

---

### Backend Deployment

**Platform:** Railway / Render / AWS ECS

**Configuration:**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Environment Variables:**
- `NODE_ENV` - production
- `PORT` - 5000
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_EXPIRES_IN` - Token expiration (e.g., "7d")
- `FRONTEND_URL` - CORS origin
- `REDIS_URL` - Redis connection (for scaling)

---

### Database Setup

**Platform:** Railway / Render / AWS RDS / Supabase

**Configuration:**
- PostgreSQL 15+
- Connection pooling enabled
- Automated backups
- SSL/TLS encryption

**Migration Strategy:**
```bash
# Development
npm run migrate:dev

# Production
npm run migrate:deploy
```

---

### CI/CD Pipeline

**GitHub Actions Example:**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railway/deploy@v1
        with:
          service: backend
          
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v2
```

---

##  Scalability Considerations

### Current Architecture Bottlenecks

1. **WebSocket Scaling** - Single server limits concurrent connections
2. **Database Queries** - Complex joins can slow down
3. **Real-time Broadcasting** - All-to-all communication overhead

### Scaling Solutions

#### **1. Redis for WebSocket Scaling**

```javascript
// Setup Redis adapter for Socket.io
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Benefits:**
- Horizontal scaling of WebSocket servers
- Shared session state
- Cross-server message broadcasting

#### **2. Database Optimization**

- **Connection Pooling:**
  ```javascript
  pool: {
    min: 2,
    max: 10
  }
  ```

- **Read Replicas:** Separate read/write operations
- **Materialized Views:** Pre-computed activity feeds
- **Partitioning:** Partition activity logs by date

#### **3. Caching Layer**

```javascript
// Redis caching for frequently accessed data
const getCachedBoard = async (boardId) => {
  const cached = await redis.get(`board:${boardId}`);
  if (cached) return JSON.parse(cached);
  
  const board = await Board.findById(boardId);
  await redis.setex(`board:${boardId}`, 300, JSON.stringify(board));
  return board;
};
```

#### **4. Rate Limiting**

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests'
});

app.use('/api/', apiLimiter);
```

#### **5. Load Balancing**

```
           Nginx Load Balancer
                   |
        ┌──────────┼──────────┐
        │          │          │
    Server 1   Server 2   Server 3
        │          │          │
        └──────────┼──────────┘
                   |
            Redis Adapter
                   |
              PostgreSQL
```

#### **6. Content Delivery Network (CDN)**

- Serve static assets via CDN
- Reduce latency for global users
- Offload traffic from origin servers

---

##  Security Considerations

### Authentication & Authorization

**Password Security:**
```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hash password
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

**JWT Implementation:**
```javascript
// Generate token
const token = jwt.sign(
  { user_id: user.id, email: user.email },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token
const decoded = jwt.verify(token, JWT_SECRET);
```

**Token Refresh Strategy:**
- Access token: 15 minutes expiration
- Refresh token: 7 days expiration
- Store refresh tokens in database

---

### Input Validation

**Using Zod:**
```javascript
const taskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  list_id: z.string().uuid(),
  due_date: z.string().datetime().optional()
});

// Middleware
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
};
```

---

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### SQL Injection Prevention

**ORM Parameterization:**
```javascript
//  Safe - using ORM
const task = await Task.findOne({
  where: { id: taskId }
});

//  Unsafe - raw query without params
const task = await db.query(`SELECT * FROM tasks WHERE id = ${taskId}`);

//  Safe - raw query with params
const task = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
```

---

### Role-Based Access Control (RBAC)

```javascript
// Middleware to check board access
const checkBoardAccess = async (req, res, next) => {
  const { boardId } = req.params;
  const userId = req.user.id;
  
  const member = await BoardMember.findOne({
    where: { board_id: boardId, user_id: userId }
  });
  
  if (!member) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  req.boardMember = member;
  next();
};

// Usage
app.delete('/api/boards/:boardId', authenticate, checkBoardAccess, deleteboard);
```

---

### Additional Security Measures

- **Helmet.js:** Security headers
- **Rate Limiting:** Prevent brute force attacks
- **XSS Protection:** Sanitize user inputs
- **CSRF Protection:** Token-based verification
- **HTTPS Only:** Enforce SSL/TLS
- **Secrets Management:** Use environment variables, never commit secrets

---

##  Assumptions & Constraints

### Features NOT Included (v1.0)

-  File attachments on tasks
-  Comments/discussion threads
-  Rich text editor for descriptions
-  Email notifications
-  Mobile app (web-only)
-  Offline support
-  Advanced permissions (beyond admin/member)
-  Time tracking
-  Custom fields
-  Integrations with third-party tools

### Scope Limitations

- **Single Organization:** No multi-tenant architecture
- **Basic Roles:** Only admin/member roles per board
- **Text-Only:** No image/file uploads
- **English Only:** No internationalization (i18n)

---

##  Technical Trade-offs

### 1. WebSocket vs. Polling

**Decision:** WebSocket (Socket.io)

**Pros:**
- Real-time updates with low latency
- Efficient bi-directional communication
- Reduced server load vs. polling

**Cons:**
- More complex to scale horizontally
- Requires persistent connections
- Fallback needed for old browsers

---

### 2. REST vs. GraphQL

**Decision:** REST API

**Pros:**
- Simpler to implement and maintain
- Better caching support
- Clearer endpoints for specific actions

**Cons:**
- Over-fetching in some cases
- Multiple requests for related data
- Less flexible querying

---

### 3. Position-Based Ordering vs. Linked List

**Decision:** Position-based (integer)

**Pros:**
- Simpler to implement
- Easy to understand and debug
- Straightforward queries

**Cons:**
- Requires reordering when moving items
- Potential race conditions with concurrent moves

**Alternative Considered:** Lexicographic ordering (fractional indexing) - rejected for complexity

---

### 4. Optimistic UI Updates

**Decision:** Implement optimistic updates

**Pros:**
- Instant feedback to users
- Better perceived performance
- Smoother drag-and-drop experience

**Cons:**
- Requires rollback logic
- Potential inconsistencies on errors
- More complex state management

---

### 5. Monolith vs. Microservices

**Decision:** Monolithic architecture

**Pros:**
- Simpler deployment
- Easier to develop initially
- Lower operational overhead

**Cons:**
- Harder to scale individual components
- Tight coupling
- Single point of failure

**Future:** Can migrate to microservices as needed

---

##  Demo Credentials

For testing the deployed application:

```
Email: demo@taskflow.com
Password: Demo123!

Sample Boards:
- "Project Management" - Example board with tasks
- "Personal To-Do" - Simple task list
```

---

##  Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis (optional, for WebSocket scaling)
- Git

---

### Backend Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/taskflow.git
cd taskflow/backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Configure environment variables
# Edit .env with your settings:
DATABASE_URL="postgresql://user:password@localhost:5432/taskflow"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
FRONTEND_URL="http://localhost:3000"

# 5. Run database migrations
npm run migrate

# 6. Seed database (optional)
npm run seed

# 7. Start development server
npm run dev

# Backend runs on http://localhost:5000
```

---

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd ../frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Configure environment variables
# Edit .env:
REACT_APP_API_URL="http://localhost:5000/api/v1"
REACT_APP_WS_URL="ws://localhost:5000"

# 5. Start development server
npm start

# Frontend runs on http://localhost:3000
```

---

### Database Setup (PostgreSQL)

```bash
# Create database
createdb taskflow

# Or using psql
psql
CREATE DATABASE taskflow;
\q
```

---

### Full Stack Commands

```bash
# Run both frontend and backend concurrently
npm run dev:all

# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm run start:prod
```

---

##  Future Enhancements

### Phase 2 Features

1. **Comments System**
   - Threaded discussions on tasks
   - @mentions for team members
   - Rich text editor support

2. **File Attachments**
   - Upload documents, images
   - Cloud storage integration (S3/CloudFlare R2)
   - Preview support for common formats

3. **Notifications**
   - In-app notifications
   - Email notifications
   - Push notifications (PWA)

4. **Advanced Permissions**
   - Custom roles (viewer, editor, admin)
   - Field-level permissions
   - Board templates with permissions

5. **Time Tracking**
   - Log hours on tasks
   - Time estimates vs. actual
   - Reporting and analytics

6. **Custom Fields**
   - Add custom properties to tasks
   - Support different field types
   - Filter and sort by custom fields

---

### Phase 3 Features

7. **Mobile Applications**
   - Native iOS app (React Native/Swift)
   - Native Android app (React Native/Kotlin)
   - Offline-first architecture

8. **Integrations**
   - Slack integration
   - GitHub/GitLab integration
   - Google Calendar sync
   - Zapier/webhook support

9. **Advanced Analytics**
   - Velocity tracking
   - Burndown charts
   - Team performance metrics
   - Custom dashboards

10. **Collaboration Features**
    - Video/audio calls
    - Screen sharing
    - Real-time cursors
    - Live editing

---

### Architecture Evolution

**Move to Microservices:**
```
API Gateway
    ├── Auth Service
    ├── Board Service
    ├── Task Service
    ├── Notification Service
    └── Search Service (Elasticsearch)
```

**Event-Driven Architecture:**
- Implement event bus (RabbitMQ/Kafka)
- Event sourcing for audit logs
- CQRS pattern for read/write separation

**Infrastructure:**
- Kubernetes orchestration
- Service mesh (Istio)
- Distributed tracing (Jaeger)
- Centralized logging (ELK stack)

---

##  Additional Resources

### Documentation

- [API Reference](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [WebSocket Events](./docs/WEBSOCKET.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

### Tech Stack Documentation

- [React](https://react.dev/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Socket.io](https://socket.io/docs/)
- [Prisma](https://www.prisma.io/docs)

---

##  Support & Contact

For questions, issues, or contributions:

- **GitHub Issues:** [github.com/yourusername/taskflow/issues](https://github.com/yourusername/taskflow/issues)
- **Email:** support@taskflow.com
- **Discord:** [Join our community](https://discord.gg/taskflow)

---

##  License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---
