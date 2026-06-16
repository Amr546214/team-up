#!/usr/bin/env node
/**
 * Seed script for Team Leader dashboard testing
 * Creates a test project with tasks, evaluations, and team members
 * 
 * Usage: node scripts/seed-team-leader-data.js
 * Requires: ADMIN_API_KEY or valid user token in environment
 */

const BASE_URL = process.env.BACKEND_URL || "https://team-up-backend-production-6c43.up.railway.app";

// Colors for console output
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
};

// Helper to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = process.env.TOKEN || process.env.ADMIN_TOKEN || process.env.BEARER_TOKEN;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    console.error(colors.red(`API Error: ${error.message}`));
    throw error;
  }
}

// Check if project already exists for job
async function findExistingProject(jobId) {
  try {
    // Try to find existing project by job reference
    const response = await apiCall(`/projects?jobId=${jobId}`);
    if (response?.projects?.length > 0) {
      return response.projects[0];
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Find active jobs
async function findActiveJobs() {
  try {
    const response = await apiCall("/jobs?status=open");
    return response?.jobs || [];
  } catch (error) {
    console.log(colors.yellow("Could not fetch jobs, trying alternative endpoint..."));
    try {
      const response = await apiCall("/client/jobs");
      return response?.jobs || response || [];
    } catch (e) {
      return [];
    }
  }
}

// Find applications for a job
async function findApplications(jobId) {
  try {
    const response = await apiCall(`/jobs/${jobId}/applications`);
    return response?.applications || [];
  } catch (error) {
    return [];
  }
}

// Find developers
async function findDevelopers() {
  try {
    const response = await apiCall("/developers");
    return response?.developers || response || [];
  } catch (error) {
    // Create mock developers if API not available
    return [
      { id: "dev-001", name: "Test Developer", email: "dev@test.com", role: "Fullstack Developer" },
      { id: "dev-002", name: "Lead Developer", email: "lead@test.com", role: "Team Leader" },
      { id: "dev-003", name: "Frontend Dev", email: "frontend@test.com", role: "Frontend Developer" },
    ];
  }
}

// Create project from job
async function createProject(job, leaderId) {
  const projectData = {
    jobId: job.id || job._id,
    title: job.title || job.name || "Test Project",
    description: job.description || "Test project for Team Leader dashboard",
    clientId: job.clientId || job.client_id || job.userId,
    status: "in_progress",
    startDate: new Date().toISOString(),
    deadline: job.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    leaderId: leaderId,
    budget: job.budget || { min: 1000, max: 5000, currency: "USD" },
    requiredSkills: job.requiredSkills || job.skills || ["React", "Node.js"],
  };
  
  try {
    // Try different endpoints
    let response;
    try {
      response = await apiCall("/projects", {
        method: "POST",
        body: JSON.stringify(projectData),
      });
    } catch (e1) {
      try {
        response = await apiCall("/company/projects", {
          method: "POST",
          body: JSON.stringify(projectData),
        });
      } catch (e2) {
        // Last resort: create via job conversion
        response = await apiCall(`/jobs/${job.id}/convert`, {
          method: "POST",
          body: JSON.stringify({ leaderId, teamMembers: [leaderId] }),
        });
      }
    }
    
    return response?.project || response;
  } catch (error) {
    console.error(colors.red(`Failed to create project: ${error.message}`));
    throw error;
  }
}

// Add team member to project
async function addTeamMember(projectId, developerId, isLeader = false) {
  try {
    const response = await apiCall(`/project/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({
        developerId,
        isLeader,
        role: isLeader ? "Team Leader" : "Developer",
        joinedAt: new Date().toISOString(),
      }),
    });
    return response;
  } catch (error) {
    console.log(colors.yellow(`Could not add team member via API: ${error.message}`));
    return null;
  }
}

// Create task
async function createTask(projectId, taskData) {
  try {
    const response = await apiCall(`/project/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(taskData),
    });
    return response?.task || response;
  } catch (error) {
    console.log(colors.yellow(`Could not create task: ${error.message}`));
    return null;
  }
}

// Create evaluation
async function createEvaluation(projectId, evaluationData) {
  try {
    const response = await apiCall(`/project/${projectId}/evaluations`, {
      method: "POST",
      body: JSON.stringify(evaluationData),
    });
    return response?.evaluation || response;
  } catch (error) {
    console.log(colors.yellow(`Could not create evaluation: ${error.message}`));
    return null;
  }
}

// Create activity record
async function createActivity(projectId, activityData) {
  try {
    const response = await apiCall(`/project/${projectId}/activities`, {
      method: "POST",
      body: JSON.stringify(activityData),
    });
    return response;
  } catch (error) {
    // Activity might be auto-generated, ignore errors
    return null;
  }
}

// Main seeding function
async function seedTeamLeaderData() {
  console.log(colors.cyan("\n========================================"));
  console.log(colors.cyan("  Team Leader Dashboard Test Data Seeder"));
  console.log(colors.cyan("========================================\n"));
  
  console.log(colors.blue(`Backend URL: ${BASE_URL}\n`));
  
  // Step 1: Find active jobs
  console.log(colors.yellow("Step 1: Finding active jobs..."));
  const jobs = await findActiveJobs();
  
  if (jobs.length === 0) {
    console.error(colors.red("❌ No active jobs found. Cannot create project without a job."));
    console.log(colors.yellow("\nOptions:"));
    console.log("1. Create a job first via the client dashboard");
    console.log("2. Or use the mock data below to test the UI");
    console.log(colors.cyan("\n--- MOCK TEST SETUP ---"));
    const mockProjectId = "mock-project-001";
    const mockLeaderId = "mock-leader-001";
    console.log(`Project ID: ${mockProjectId}`);
    console.log(`Leader ID: ${mockLeaderId}`);
    console.log(`Dashboard URL: /team-leader/dashboard?projectId=${mockProjectId}`);
    console.log(colors.cyan("--- END MOCK ---\n"));
    return;
  }
  
  console.log(colors.green(`✓ Found ${jobs.length} active job(s)`));
  const selectedJob = jobs[0];
  console.log(colors.blue(`  Selected Job: ${selectedJob.title || selectedJob.name || selectedJob.id}`));
  console.log(`  Job ID: ${selectedJob.id || selectedJob._id}`);
  
  // Step 2: Check for existing project
  const jobId = selectedJob.id || selectedJob._id;
  console.log(colors.yellow("\nStep 2: Checking for existing project..."));
  
  const existingProject = await findExistingProject(jobId);
  if (existingProject) {
    console.log(colors.green("✓ Test project already exists!"));
    console.log(colors.cyan("\n========================================"));
    console.log(colors.green("  EXISTING TEST PROJECT"));
    console.log(colors.cyan("========================================"));
    console.log(`Project ID: ${existingProject.id || existingProject._id}`);
    console.log(`Title: ${existingProject.title || existingProject.name}`);
    console.log(`Leader ID: ${existingProject.leaderId || existingProject.leader_id}`);
    console.log(colors.cyan("\n--- Dashboard URL ---"));
    console.log(`/team-leader/dashboard?projectId=${existingProject.id || existingProject._id}`);
    console.log(colors.cyan("========================================\n"));
    return;
  }
  
  console.log(colors.green("✓ No existing project found, creating new..."));
  
  // Step 3: Find developers
  console.log(colors.yellow("\nStep 3: Finding developers..."));
  const developers = await findDevelopers();
  
  if (developers.length === 0) {
    console.error(colors.red("❌ No developers found."));
    return;
  }
  
  console.log(colors.green(`✓ Found ${developers.length} developer(s)`));
  const leader = developers[0];
  const teamMember1 = developers[1] || developers[0];
  const teamMember2 = developers[2] || developers[0];
  
  console.log(colors.blue(`  Leader: ${leader.name} (${leader.email})`));
  console.log(`  Leader ID: ${leader.id || leader._id}`);
  
  // Step 4: Create project
  console.log(colors.yellow("\nStep 4: Creating project from job..."));
  let project;
  try {
    project = await createProject(selectedJob, leader.id || leader._id);
    console.log(colors.green("✓ Project created successfully"));
    console.log(`  Project ID: ${project.id || project._id}`);
  } catch (error) {
    console.error(colors.red(`❌ Failed to create project: ${error.message}`));
    console.log(colors.yellow("\nUsing fallback mock project for testing..."));
    project = {
      id: `project-${Date.now()}`,
      title: selectedJob.title || "Test Project",
      leaderId: leader.id || leader._id,
    };
    console.log(colors.cyan(`Mock Project ID: ${project.id}`));
  }
  
  const projectId = project.id || project._id;
  
  // Step 5: Add team members
  console.log(colors.yellow("\nStep 5: Adding team members..."));
  
  const members = [
    { dev: leader, isLeader: true, role: "Team Leader" },
    { dev: teamMember1, isLeader: false, role: "Frontend Developer" },
    { dev: teamMember2, isLeader: false, role: "Backend Developer" },
  ];
  
  for (const member of members) {
    const result = await addTeamMember(
      projectId,
      member.dev.id || member.dev._id,
      member.isLeader
    );
    if (result) {
      console.log(colors.green(`  ✓ Added ${member.dev.name} as ${member.role}`));
    }
  }
  
  // Step 6: Create tasks
  console.log(colors.yellow("\nStep 6: Creating test tasks..."));
  
  const tasks = [
    {
      title: "Setup project repository",
      description: "Initialize Git repo, add README, setup branch protection",
      priority: "high",
      status: "done",
      assignedTo: leader.id || leader._id,
      assignedToName: leader.name,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Design database schema",
      description: "Create ERD diagram, define tables and relationships",
      priority: "high",
      status: "in-progress",
      assignedTo: teamMember2.id || teamMember2._id,
      assignedToName: teamMember2.name,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Create UI mockups",
      description: "Design Figma mockups for main screens",
      priority: "medium",
      status: "todo",
      assignedTo: teamMember1.id || teamMember1._id,
      assignedToName: teamMember1.name,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  
  const createdTasks = [];
  for (const task of tasks) {
    const result = await createTask(projectId, task);
    if (result) {
      console.log(colors.green(`  ✓ Created task: ${task.title}`));
      createdTasks.push(result);
    }
  }
  
  // Step 7: Create evaluations
  console.log(colors.yellow("\nStep 7: Creating test evaluations..."));
  
  const evaluations = [
    {
      memberUser: teamMember1.id || teamMember1._id,
      memberName: teamMember1.name,
      rating: 5,
      comment: "Excellent work on the frontend components. Great attention to detail.",
      evaluatedBy: leader.id || leader._id,
      evaluatedAt: new Date().toISOString(),
    },
    {
      memberUser: teamMember2.id || teamMember2._id,
      memberName: teamMember2.name,
      rating: 4,
      comment: "Good progress on backend API. Needs to improve documentation.",
      evaluatedBy: leader.id || leader._id,
      evaluatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  
  const createdEvaluations = [];
  for (const evaluation of evaluations) {
    const result = await createEvaluation(projectId, evaluation);
    if (result) {
      console.log(colors.green(`  ✓ Created evaluation for ${evaluation.memberName}`));
      createdEvaluations.push(result);
    }
  }
  
  // Step 8: Create activity records
  console.log(colors.yellow("\nStep 8: Creating activity records..."));
  
  const activities = [
    {
      type: "task_created",
      message: `Created task "${tasks[0].title}"`,
      userId: leader.id || leader._id,
      userName: leader.name,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: "member_joined",
      message: `${teamMember1.name} joined the project`,
      userId: teamMember1.id || teamMember1._id,
      userName: teamMember1.name,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: "evaluation_added",
      message: `New evaluation added for ${teamMember1.name}`,
      userId: leader.id || leader._id,
      userName: leader.name,
      timestamp: new Date().toISOString(),
    },
  ];
  
  for (const activity of activities) {
    const result = await createActivity(projectId, activity);
    if (result) {
      console.log(colors.green(`  ✓ Created activity: ${activity.message}`));
    }
  }
  
  // Summary
  console.log(colors.cyan("\n========================================"));
  console.log(colors.green("  SEEDING COMPLETE!"));
  console.log(colors.cyan("========================================"));
  console.log(`\n${colors.blue("Project Details:")}`);
  console.log(`  Project ID: ${projectId}`);
  console.log(`  Title: ${project.title || selectedJob.title}`);
  console.log(`  Source Job ID: ${jobId}`);
  console.log(`\n${colors.blue("Team Leader:")}`);
  console.log(`  User ID: ${leader.id || leader._id}`);
  console.log(`  Name: ${leader.name}`);
  console.log(`  Email: ${leader.email}`);
  console.log(`\n${colors.blue("Created Data:")}`);
  console.log(`  Tasks: ${createdTasks.length}/3`);
  console.log(`  Evaluations: ${createdEvaluations.length}/2`);
  console.log(`  Team Members: ${members.length}`);
  console.log(colors.cyan("\n--- Test Dashboard URL ---"));
  console.log(`/team-leader/dashboard?projectId=${projectId}`);
  console.log(colors.cyan("========================================\n"));
  
  console.log(colors.green("Next steps:"));
  console.log("1. Login as the team leader developer");
  console.log(`2. Navigate to: /team-leader/dashboard?projectId=${projectId}`);
  console.log("3. Test adding tasks, updating status, and creating evaluations\n");
}

// Error handler
process.on("unhandledRejection", (error) => {
  console.error(colors.red("\n❌ Unhandled error:"), error.message);
  process.exit(1);
});

// Run if executed directly
if (require.main === module) {
  seedTeamLeaderData().catch((error) => {
    console.error(colors.red("\n❌ Seeding failed:"), error.message);
    console.log(colors.yellow("\nTroubleshooting:"));
    console.log("1. Ensure BACKEND_URL is set correctly");
    console.log("2. Set TOKEN or ADMIN_TOKEN environment variable");
    console.log("3. Check that the backend API is running");
    console.log("\nExample usage:");
    console.log("  TOKEN=your-jwt-token node scripts/seed-team-leader-data.js");
    console.log("  BACKEND_URL=http://localhost:3000 TOKEN=xxx node scripts/seed-team-leader-data.js");
    process.exit(1);
  });
}

module.exports = { seedTeamLeaderData };
