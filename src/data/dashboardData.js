export const dashboardData = {
  project: {
    id: 1,
    title: "Website Redesign",
    status: "Active",
    company: "Acme Corp",
  },

  tasks: [
    {
      id: 1,
      priority: "High Priority",
      priorityType: "high",
      status: "In Progress",
      statusType: "progress",
      title: "Visual Identity Update",
      description:
        "Complete the new brand guidelines and update all logo assets across platforms.",
      assigneeId: 2,
      assignee: "Sara Ahmed",
      deadline: "Oct 24, 2026",
    },
    {
      id: 2,
      priority: "Medium",
      priorityType: "medium",
      status: "To Do",
      statusType: "todo",
      title: "Dashboard Wireframes",
      description: "Create initial wireframes for the analytics dashboard.",
      assigneeId: 1,
      assignee: "Hanan Muhammed",
      deadline: "Oct 28, 2026",
    },
  ],

  teamMembers: [
    {
      id: 1,
      name: "Hanan Muhammed",
      role: "Lead Designer",
      level: "Senior",
      email: "hanan@example.com",
    },
    {
      id: 2,
      name: "Sara Ahmed",
      role: "Frontend Dev",
      level: "Mid",
      email: "sara@example.com",
    },
  ],

  replaceOptions: [
    {
      id: 3,
      name: "Youssef Khaled",
      role: "UI Designer",
      level: "Senior",
      email: "youssef@example.com",
    },
    {
      id: 4,
      name: "Eman Ali",
      role: "Frontend Dev",
      level: "Mid",
      email: "eman@example.com",
    },
    {
      id: 5,
      name: "Omar Essam",
      role: "Product Designer",
      level: "Senior",
      email: "omar@example.com",
    },
  ],

  evaluations: [
    {
      id: 1,
      name: "Hanan Muhammed",
      rating: 4,
      comment:
        "Completed DB migration ahead of schedule. Minor bug in staging.",
    },
  ],

  recentActivity: [
    {
      id: 1,
      title: "Task Completed",
      time: "2h ago",
      description: 'Hanan finished "Visual Identity Update"',
    },
  ],
};