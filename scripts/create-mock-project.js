#!/usr/bin/env node
/**
 * Quick mock project generator for Team Leader dashboard testing
 * This creates a mock project ID you can use to test the UI
 * when backend project creation APIs are not yet available.
 * 
 * Usage: node scripts/create-mock-project.js
 */

const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
};

function generateMockProject() {
  const timestamp = Date.now();
  const projectId = `test-project-${timestamp}`;
  
  // Mock data structure matching the frontend expectations
  const mockProjectData = {
    project: {
      id: projectId,
      title: "E-Commerce Platform Development",
      description: "Building a full-stack e-commerce platform with React and Node.js",
      status: "in_progress",
      clientName: "TechCorp Inc.",
      budget: { min: 5000, max: 10000, currency: "USD" },
      startDate: new Date().toISOString(),
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 35,
      leaderId: "dev-leader-001",
    },
    teamMembers: [
      {
        id: "dev-leader-001",
        name: "Sarah Johnson",
        email: "sarah.leader@example.com",
        role: "Team Leader",
        avatar: "https://i.pravatar.cc/150?u=leader",
        skills: ["React", "Node.js", "Project Management"],
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        isLeader: true,
      },
      {
        id: "dev-002",
        name: "Mike Chen",
        email: "mike.chen@example.com",
        role: "Frontend Developer",
        avatar: "https://i.pravatar.cc/150?u=frontend",
        skills: ["React", "TypeScript", "TailwindCSS"],
        joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        isLeader: false,
      },
      {
        id: "dev-003",
        name: "Emily Davis",
        email: "emily.davis@example.com",
        role: "Backend Developer",
        avatar: "https://i.pravatar.cc/150?u=backend",
        skills: ["Node.js", "PostgreSQL", "Express"],
        joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        isLeader: false,
      },
      {
        id: "dev-004",
        name: "Alex Wilson",
        email: "alex.wilson@example.com",
        role: "UI/UX Designer",
        avatar: "https://i.pravatar.cc/150?u=designer",
        skills: ["Figma", "UI Design", "Prototyping"],
        joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        isLeader: false,
      },
    ],
    currentTasks: [
      {
        id: `task-${timestamp}-1`,
        title: "Setup project repository and CI/CD",
        description: "Initialize Git repository, setup GitHub Actions for deployment",
        priority: "high",
        status: "done",
        assignedTo: "dev-leader-001",
        assignedToName: "Sarah Johnson",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `task-${timestamp}-2`,
        title: "Design database schema",
        description: "Create ERD diagram and define all database tables and relationships",
        priority: "high",
        status: "in-progress",
        assignedTo: "dev-003",
        assignedToName: "Emily Davis",
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `task-${timestamp}-3`,
        title: "Create UI mockups in Figma",
        description: "Design all main screens: homepage, product page, cart, checkout",
        priority: "medium",
        status: "in-progress",
        assignedTo: "dev-004",
        assignedToName: "Alex Wilson",
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `task-${timestamp}-4`,
        title: "Setup React project structure",
        description: "Initialize React app with Vite, setup routing and folder structure",
        priority: "high",
        status: "todo",
        assignedTo: "dev-002",
        assignedToName: "Mike Chen",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `task-${timestamp}-5`,
        title: "Implement authentication API",
        description: "Create login, register, and JWT token endpoints",
        priority: "high",
        status: "todo",
        assignedTo: "dev-003",
        assignedToName: "Emily Davis",
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `task-${timestamp}-6`,
        title: "Write API documentation",
        description: "Document all endpoints with Swagger/OpenAPI",
        priority: "low",
        status: "todo",
        assignedTo: "dev-leader-001",
        assignedToName: "Sarah Johnson",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
    recentEvaluations: [
      {
        id: `eval-${timestamp}-1`,
        memberUser: "dev-002",
        memberName: "Mike Chen",
        rating: 5,
        comment: "Excellent work on the component library. Code is clean and well-tested.",
        evaluatedBy: "dev-leader-001",
        evaluatedByName: "Sarah Johnson",
        evaluatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `eval-${timestamp}-2`,
        memberUser: "dev-003",
        memberName: "Emily Davis",
        rating: 4,
        comment: "Good progress on database design. Consider adding more indexes for performance.",
        evaluatedBy: "dev-leader-001",
        evaluatedByName: "Sarah Johnson",
        evaluatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `eval-${timestamp}-3`,
        memberUser: "dev-004",
        memberName: "Alex Wilson",
        rating: 5,
        comment: "Outstanding UI designs! Client is very happy with the mockups.",
        evaluatedBy: "dev-leader-001",
        evaluatedByName: "Sarah Johnson",
        evaluatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    recentActivity: [
      {
        id: `act-${timestamp}-1`,
        type: "task_created",
        message: "Created task: Write API documentation",
        userId: "dev-leader-001",
        userName: "Sarah Johnson",
        timestamp: new Date().toISOString(),
      },
      {
        id: `act-${timestamp}-2`,
        type: "evaluation_added",
        message: "Added evaluation for Mike Chen",
        userId: "dev-leader-001",
        userName: "Sarah Johnson",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `act-${timestamp}-3`,
        type: "task_completed",
        message: "Completed: Setup project repository and CI/CD",
        userId: "dev-leader-001",
        userName: "Sarah Johnson",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `act-${timestamp}-4`,
        type: "member_joined",
        message: "Alex Wilson joined the project",
        userId: "dev-004",
        userName: "Alex Wilson",
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    actions: {
      canAddTask: true,
      canEditProject: true,
      canManageMembers: true,
      canViewReports: true,
    },
  };
  
  return { projectId, mockProjectData };
}

function printInstructions() {
  console.log(colors.cyan("\n========================================"));
  console.log(colors.cyan("  MOCK PROJECT GENERATOR"));
  console.log(colors.cyan("========================================\n"));
  
  const { projectId, mockProjectData } = generateMockProject();
  
  console.log(colors.green("✓ Mock project generated!\n"));
  
  console.log(colors.blue("Project Details:"));
  console.log(`  Project ID: ${projectId}`);
  console.log(`  Title: ${mockProjectData.project.title}`);
  console.log(`  Status: ${mockProjectData.project.status}`);
  console.log(`  Progress: ${mockProjectData.project.progress}%`);
  console.log(`  Team Size: ${mockProjectData.teamMembers.length} members`);
  console.log(`  Tasks: ${mockProjectData.currentTasks.length} tasks`);
  console.log(`  Evaluations: ${mockProjectData.recentEvaluations.length} evaluations`);
  
  console.log(colors.cyan("\n--- Dashboard URL ---"));
  console.log(`/team-leader/dashboard?projectId=${projectId}`);
  
  console.log(colors.cyan("\n--- Full URL (local dev) ---"));
  console.log(`http://localhost:5173/team-leader/dashboard?projectId=${projectId}`);
  
  console.log(colors.cyan("\n========================================"));
  console.log(colors.yellow("IMPORTANT:"));
  console.log(colors.cyan("========================================"));
  console.log("This is a mock project ID for UI testing only.");
  console.log("The backend will return 404 until you:");
  console.log("1. Run the full seed script with a valid token");
  console.log("2. Or implement the project creation API on the backend");
  console.log("3. Or use backend mock data that returns this projectId\n");
  
  console.log(colors.blue("Test Accounts:"));
  console.log("  Leader (login with):");
  console.log(`    User ID: dev-leader-001`);
  console.log(`    Name: ${mockProjectData.teamMembers[0].name}`);
  console.log(`    Email: ${mockProjectData.teamMembers[0].email}`);
  console.log("\n  Team Members:");
  mockProjectData.teamMembers.slice(1).forEach((m, i) => {
    console.log(`    ${i + 1}. ${m.name} (${m.role}) - ${m.email}`);
  });
  
  console.log(colors.cyan("\n--- Mock Data JSON (for backend reference) ---"));
  console.log("Save this to use as reference for backend data structure:\n");
  console.log(JSON.stringify(mockProjectData, null, 2));
  
  return { projectId, mockProjectData };
}

// Run
printInstructions();

module.exports = { generateMockProject };
