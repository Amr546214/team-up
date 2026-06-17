# Team Leader Architecture Design

## Executive Summary

**Current Problem:** Team Leader is being treated as a separate authentication role (`role = "team-leader"`), which breaks the relationship between a developer and their projects.

**Proposed Solution:** Team Leader status should be **project-based**, not account-based. A developer remains `role = "developer"` but can be assigned as team leader for specific projects.

---

## 1. Current Database Structure

### Existing Tables (from Supabase)
```sql
public.profiles (
  id: uuid (PK, FK to auth.users),
  full_name: text,
  email: text,
  phone: text,
  avatar_url: text,
  created_at: timestamptz,
  updated_at: timestamptz
)
```

### Missing Tables
- Projects/Job postings
- Project teams/members
- Applications/proposals
- Tasks/assignments
- Team leadership assignments

---

## 2. Recommended Schema Design

### Option: Hybrid Approach (RECOMMENDED)

```sql
-- =============================================
-- CORE PROJECT TABLE
-- =============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled'
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  leader_id UUID REFERENCES public.profiles(id), -- Primary leader (fast lookup)
  company_name TEXT,
  location_type VARCHAR(50) DEFAULT 'remote',
  posted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- PROJECT MEMBERS (Team assignments with leader flag)
-- =============================================
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'developer', -- Their role on the team
  is_leader BOOLEAN DEFAULT false, -- Can have multiple leaders (co-leaders)
  can_manage_tasks BOOLEAN DEFAULT false,
  can_manage_members BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'removed', 'left'
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(project_id, developer_id)
);

-- =============================================
-- PROJECT APPLICATIONS
-- =============================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proposed_budget DECIMAL(10,2),
  proposed_duration_weeks INTEGER,
  cover_letter TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  is_team_leader_application BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(project_id, developer_id)
);

-- =============================================
-- TASKS
-- =============================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_leader ON public.projects(leader_id) WHERE leader_id IS NOT NULL;
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_developer ON public.project_members(developer_id);
CREATE INDEX idx_project_members_leader ON public.project_members(project_id, is_leader) WHERE is_leader = true;
```

---

## 3. Required Frontend Changes

### A. AuthContext Changes (REVERT PREVIOUS WORK)

**REMOVE:**
```javascript
// REMOVE this from ROLE_REDIRECTS
"team-leader": "/team-leader/dashboard",
```

**KEEP:**
```javascript
const ROLE_REDIRECTS = {
  client: "/client/profile",
  developer: "/developer/dashboard",  // All developers go here
  company: "/company/profile",
  admin: "/admin/dashboard",
};
```

### B. New Hook: useProjectLeadership()

```javascript
// src/hooks/useProjectLeadership.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

export function useProjectLeadership() {
  const { session } = useAuth();
  const [ledProjects, setLedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState(null);

  useEffect(() => {
    const fetchLedProjects = async () => {
      if (!session?.id) return;
      
      try {
        const token = localStorage.getItem("teamup_access_token");
        const response = await fetch(
          `${BASE_URL}/developer/led-projects`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setLedProjects(data.projects || []);
          const active = data.projects?.find(p => p.status === 'in_progress');
          if (active) setActiveProjectId(active.id);
        }
      } catch (error) {
        console.error("Failed to fetch led projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLedProjects();
  }, [session?.id]);

  return {
    ledProjects,
    isLoading,
    isTeamLeader: ledProjects.length > 0,
    hasActiveProject: ledProjects.some(p => p.status === 'in_progress'),
    activeProjectId,
    setActiveProjectId,
  };
}
```

### C. DeveloperSidebar Changes

```javascript
// Add conditional Team Leader section
import { useProjectLeadership } from "../../hooks/useProjectLeadership";

function DeveloperSidebar() {
  const { isTeamLeader, ledProjects, activeProjectId } = useProjectLeadership();
  
  const menuItems = [
    { id: 1, key: "dashboard", name: "Dashboard", path: "/developer/dashboard" },
    { id: 2, key: "projects", name: "Browse Projects", path: "/developer/projects" },
    { id: 3, key: "applications", name: "My Applications", path: "/developer/applications" },
    { id: 4, key: "profile", name: "Profile", path: "/developer/profile" },
  ];

  // Add Team Leader section if user leads any projects
  const teamLeaderItems = isTeamLeader ? [
    { 
      id: 5, 
      key: "team-leader", 
      name: "Team Leader", 
      path: `/team-leader/dashboard?project=${activeProjectId}`,
      badge: "Leader",
      badgeColor: "bg-teal-100 text-teal-700"
    },
  ] : [];

  return (
    <aside>
      {/* Regular menu items */}
      {menuItems.map(item => <MenuItem key={item.id} item={item} />)}
      
      {/* Team Leader Section - Only if leading projects */}
      {isTeamLeader && (
        <>
          <div className="my-4 border-t border-gray-200" />
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
            Team Leadership
          </p>
          {teamLeaderItems.map(item => (
            <MenuItem key={item.id} item={item} />
          ))}
          
          {/* Quick switch between led projects */}
          {ledProjects.length > 1 && (
            <div className="px-4 py-2">
              <p className="text-xs text-gray-400 mb-2">Your Teams</p>
              {ledProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => navigate(`/team-leader/dashboard?project=${project.id}`)}
                  className={`block w-full text-left px-2 py-1 text-sm rounded ${
                    activeProjectId === project.id 
                      ? 'bg-teal-50 text-teal-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {project.title}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
```

### D. Header Changes (REVERT + INTEGRATE)

**REMOVE separate Team Leader button, integrate into Developer dropdown:**

```javascript
const { ledProjects, isTeamLeader } = useProjectLeadership();

// In dropdown:
{isAuthenticated && (
  <div className="dropdown">
    {/* Dashboard - goes to developer dashboard */}
    <button onClick={() => navigate("/developer/dashboard")}>
      Dashboard
    </button>
    
    {/* Team Leader Projects - only if leading */}
    {isTeamLeader && ledProjects.length > 0 && (
      <>
        <div className="border-t my-2" />
        <p className="px-4 py-1 text-xs text-gray-500">Team Leader</p>
        {ledProjects.map(project => (
          <button
            key={project.id}
            onClick={() => navigate(`/team-leader/dashboard?project=${project.id}`)}
            className="text-teal-600"
          >
            {project.title}
          </button>
        ))}
      </>
    )}
    
    <button onClick={handleLogout}>Logout</button>
  </div>
)}
```

### E. TeamDashboard Changes

```javascript
// src/pages/team-leader/TeamDashboard.jsx
import { useSearchParams } from "react-router-dom";
import { useProjectLeadership } from "../../hooks/useProjectLeadership";

function TeamDashboard() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const { ledProjects, isLoading: isLoadingAuth } = useProjectLeadership();
  
  // Verify this developer leads this project
  const isAuthorized = ledProjects.some(p => p.id === projectId);
  
  if (!isAuthorized && !isLoadingAuth) {
    return <Navigate to="/developer/dashboard" replace />;
  }

  // Fetch project-specific data
  useEffect(() => {
    if (!projectId) return;
    
    fetch(`${BASE_URL}/team-leader/projects/${projectId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => res.json())
    .then(data => setDashboardData(data));
  }, [projectId]);

  // ... rest of component
}
```

---

## 4. Required Backend/API Changes

### New API Endpoints

```javascript
// Developer endpoints
GET /developer/led-projects              // List projects where dev is leader

// Team Leader endpoints (require is_leader = true for project)
GET    /team-leader/projects/:id/dashboard
POST   /team-leader/projects/:id/tasks
PUT    /team-leader/projects/:id/tasks/:taskId
PUT    /team-leader/projects/:id/members/:id/replace
POST   /team-leader/projects/:id/members
DELETE /team-leader/projects/:id/members/:id
GET    /team-leader/projects/:id/available-developers

// Company/Client endpoints
POST /company/projects/:id/assign-leader
POST /company/projects/:id/ai-suggest-team
POST /company/projects/:id/accept-team
```

### Backend Middleware

```javascript
// Middleware to check if user is team leader for specific project
function requireTeamLeader(req, res, next) {
  const { projectId } = req.params;
  const userId = req.user.id;
  
  const isLeader = await db.query(
    `SELECT 1 FROM project_members 
     WHERE project_id = $1 AND developer_id = $2 AND is_leader = true`,
    [projectId, userId]
  );
  
  if (!isLeader) {
    return res.status(403).json({ error: "Must be team leader" });
  }
  
  next();
}

// Apply to all team-leader routes
app.use("/team-leader/projects/:projectId", requireTeamLeader);
```

---

## 5. Complete Flow

### Step-by-Step

1. **Client Posts Job** → Project created with status = "open"
2. **AI Team Selection** → Suggests team including leader
3. **Client Reviews** → Can modify suggested team
4. **Client Accepts Team** → Backend:
   - Creates `project_members` entries
   - Sets `is_leader = true` for leader
   - Updates `projects.leader_id`
   - Sends notifications
5. **Project Starts** → status = "in_progress"
6. **Developer Logs In** → role = "developer", goes to /developer/dashboard
7. **Sidebar Loads** → Calls `GET /developer/led-projects`
   - If has led projects → shows "Team Leadership" section
8. **Developer Clicks "Team Leader"** → Navigate to `/team-leader/dashboard?project=:id`
9. **Authorization Check** → Verify `ledProjects.includes(projectId)`
10. **Dashboard Loads** → Shows project-specific team, tasks, evaluations

### Visual Flow

```
Client Posts Job 
    ↓
AI Suggests Team (with leader)
    ↓
Client Accepts
    ↓
Backend Assigns: is_leader = true in project_members
    ↓
Developer Logs In (role = developer)
    ↓
Sidebar: GET /developer/led-projects → Shows "Team Leadership"
    ↓
Click → /team-leader/dashboard?project=ID
    ↓
Verify leader for project → Load dashboard
```

---

## 6. Summary of Changes

### Revert (from previous work):
- `AuthContext.jsx`: Remove `"team-leader"` from ROLE_REDIRECTS
- `authStorage.js`: Remove `case "team-leader"` from getDashboardPath
- `Header.jsx`: Remove separate Team Leader button

### New Implementation:
- **NEW**: `hooks/useProjectLeadership.js` - Check if dev leads any projects
- **UPDATE**: `DeveloperSidebar.jsx` - Add conditional Team Leadership section
- **UPDATE**: `Header.jsx` - Show led projects in developer dropdown
- **UPDATE**: `TeamDashboard.jsx` - Use `?project=` query param
- **NO CHANGE**: `RoleRoute.jsx` - Still checks role === "developer"

### Backend Needed:
- Database: CREATE TABLE projects, project_members, applications, tasks
- API: `GET /developer/led-projects`
- API: `GET /team-leader/projects/:id/dashboard`
- API: `POST /team-leader/projects/:id/tasks`
- API: `PUT /team-leader/projects/:id/members/:id/replace`
- Middleware: `requireTeamLeader()`

---

## 7. Key Design Principles

1. **Project-Based:** Leadership tied to `project_members.is_leader`, not `profiles.role`
2. **Dynamic UI:** Team Leader tools appear only when `ledProjects.length > 0`
3. **URL Scoping:** `/team-leader/dashboard?project=uuid` for clarity
4. **Permission Hierarchy:**
   ```
   Client (owns project) → assigns leader
   Developer (is_leader) → manages team/tasks
   Developer (member) → works on assigned tasks
   ```
