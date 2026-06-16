# Team Leader Dashboard Test Data

This directory contains scripts to seed test data for the Team Leader dashboard.

## Files

| File | Purpose |
|------|---------|
| `seed-team-leader-data.js` | Full seeding script that uses backend APIs to create real data |
| `create-mock-project.js` | Generates mock project ID and data structure for reference |

## Quick Start

### Option 1: Mock Project (No Backend Changes)

For UI testing when the backend project creation API doesn't exist yet:

```bash
node scripts/create-mock-project.js
```

This outputs:
- A mock `projectId` you can use in the URL
- Expected data structure for backend reference
- Test accounts for manual testing

### Option 2: Real Seed Data (Requires Backend Token)

When you have a valid JWT token and working backend APIs:

```bash
# Set environment variables
export TOKEN="your-jwt-token-here"
export BACKEND_URL="https://team-up-backend-production-6c43.up.railway.app"

# Run the seeder
node scripts/seed-team-leader-data.js
```

The script will:
1. Find an active job from the database
2. Find available developers
3. Create a project from that job
4. Assign a team leader and team members
5. Create 3 test tasks (with different statuses)
6. Create 2 test evaluations
7. Create activity records
8. Print the dashboard URL

## Required Backend APIs

The seed script expects these endpoints to exist:

### GET Endpoints (for reading data)
```
GET /jobs?status=open              # Find active jobs
GET /jobs/:id/applications         # Find applications for a job
GET /developers                    # Find available developers
GET /projects?jobId=:id            # Check for existing project
```

### POST Endpoints (for creating data)
```
POST /projects                     # Create new project
POST /project/:id/members          # Add team member
POST /project/:id/tasks            # Create task
POST /project/:id/evaluations      # Create evaluation
POST /project/:id/activities       # Create activity record
```

### Alternative Endpoints (fallbacks)
```
POST /jobs/:id/convert             # Convert job to project
POST /company/projects             # Company creates project
```

## Expected Backend Data Structure

Based on the frontend code in `TeamDashboard.jsx`, the backend should return:

### GET /project/:projectId/leader-dashboard Response

```json
{
  "project": {
    "id": "uuid",
    "title": "Project Name",
    "description": "Project description",
    "status": "in_progress",
    "clientName": "Client Company",
    "progress": 35,
    "budget": { "min": 1000, "max": 5000, "currency": "USD" },
    "startDate": "2024-01-15T00:00:00Z",
    "deadline": "2024-03-15T00:00:00Z",
    "leaderId": "developer-uuid"
  },
  "teamMembers": [
    {
      "id": "developer-uuid",
      "name": "Developer Name",
      "email": "dev@example.com",
      "role": "Team Leader",
      "avatar": "https://...",
      "skills": ["React", "Node.js"],
      "isLeader": true,
      "joinedAt": "2024-01-10T00:00:00Z"
    }
  ],
  "currentTasks": [
    {
      "id": "task-uuid",
      "title": "Task title",
      "description": "Task description",
      "priority": "high|medium|low",
      "status": "todo|in-progress|done",
      "assignedTo": "developer-uuid",
      "assignedToName": "Developer Name",
      "deadline": "2024-02-01T00:00:00Z",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "recentEvaluations": [
    {
      "id": "eval-uuid",
      "memberUser": "developer-uuid",
      "memberName": "Developer Name",
      "rating": 5,
      "comment": "Evaluation comment",
      "evaluatedBy": "leader-uuid",
      "evaluatedByName": "Leader Name",
      "evaluatedAt": "2024-01-20T00:00:00Z"
    }
  ],
  "recentActivity": [
    {
      "id": "activity-uuid",
      "type": "task_created|member_joined|evaluation_added|task_completed",
      "message": "Human-readable activity description",
      "userId": "developer-uuid",
      "userName": "Developer Name",
      "timestamp": "2024-01-20T00:00:00Z"
    }
  ],
  "actions": {
    "canAddTask": true,
    "canEditProject": true,
    "canManageMembers": true,
    "canViewReports": true
  }
}
```

### POST /project/:projectId/tasks Request Body

```json
{
  "title": "Task title",
  "description": "Task description",
  "priority": "high|medium|low",
  "assignedTo": "developer-uuid",
  "assignedToName": "Developer Name",
  "deadline": "2024-02-01T00:00:00Z"
}
```

### POST /project/:projectId/evaluations Request Body

```json
{
  "memberUser": "developer-uuid",
  "memberName": "Developer Name",
  "rating": 5,
  "comment": "Evaluation comment"
}
```

### PATCH /project/:projectId/tasks/:taskId/status Request Body

```json
{
  "status": "todo|in-progress|done"
}
```

### PATCH /project/:projectId/tasks/:taskId/reassign Request Body

```json
{
  "assignedTo": "new-developer-uuid",
  "assignedToName": "New Developer Name"
}
```

## Database Collections

Based on the investigation, you need these MongoDB/Supabase collections:

### `projects`
```javascript
{
  _id: ObjectId,
  jobId: ObjectId,           // Reference to jobs collection
  title: String,
  description: String,
  clientId: ObjectId,
  leaderId: ObjectId,        // Reference to profiles (developer)
  status: String,            // "open", "in_progress", "completed", "cancelled"
  startDate: Date,
  deadline: Date,
  budget: {
    min: Number,
    max: Number,
    currency: String
  },
  requiredSkills: [String],
  progress: Number,          // 0-100
  createdAt: Date,
  updatedAt: Date
}
```

### `project_members`
```javascript
{
  _id: ObjectId,
  projectId: ObjectId,       // Reference to projects
  developerId: ObjectId,     // Reference to profiles
  role: String,              // "Team Leader", "Frontend Dev", etc.
  isLeader: Boolean,         // true for team leader
  joinedAt: Date,
  status: String             // "active", "removed", "left"
}
```

### `tasks`
```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  title: String,
  description: String,
  priority: String,          // "high", "medium", "low"
  status: String,            // "todo", "in-progress", "done"
  assignedTo: ObjectId,      // Reference to profiles
  assignedToName: String,    // Denormalized for quick display
  deadline: Date,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### `evaluations`
```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  memberUser: ObjectId,      // Developer being evaluated
  memberName: String,        // Denormalized
  rating: Number,            // 1-5
  comment: String,
  evaluatedBy: ObjectId,     // Team leader who created evaluation
  evaluatedByName: String,
  evaluatedAt: Date
}
```

### `project_activities` (optional)
```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  type: String,              // "task_created", "member_joined", etc.
  message: String,
  userId: ObjectId,
  userName: String,
  metadata: Object,          // Additional context
  timestamp: Date
}
```

## Manual Testing Steps

Once you've created test data:

1. **Login as Team Leader**
   - Use the developer account that was assigned as leader
   - Navigate to `/developer/dashboard` first

2. **Access Team Leader Dashboard**
   - Look for "Team Leadership" section in sidebar
   - Click it or navigate directly:
   ```
   /team-leader/dashboard?projectId=<project-id>
   ```

3. **Test Features**
   - **Add Task**: Click "Add Task" button, fill form, submit
   - **Update Status**: Use dropdown on task card to change status
   - **Reassign Task**: Click reassign icon, select new member
   - **View Profile**: Click "View Profile" on team member
   - **Add Evaluation**: Click "+ Add" in Evaluations section
   - **Refresh Data**: Click "Refresh" buttons

4. **Verify Data Persistence**
   - Reload page - data should persist
   - Check backend database for created records

## Troubleshooting

### "Project not found" error
- The project ID doesn't exist in database
- Use the mock generator for UI testing: `node scripts/create-mock-project.js`
- Or run the full seeder with valid token

### "Unauthorized" error
- Token is missing or expired
- Set `TOKEN` environment variable with valid JWT
- Token should have `role: "developer"` in payload

### "You don't have permission" error
- The logged-in user is not the team leader for this project
- Check `project_members` collection for `isLeader: true`
- The `developerId` in token must match `project_members.developerId`

### "Failed to add task" error
- Backend `POST /project/:id/tasks` endpoint missing
- Check backend logs for errors
- Verify request body matches expected schema

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TOKEN` | Yes* | JWT token for authentication |
| `ADMIN_TOKEN` | Alternative | Admin JWT with elevated permissions |
| `BACKEND_URL` | No | Defaults to Railway URL |

*Required for `seed-team-leader-data.js`, not needed for `create-mock-project.js`
