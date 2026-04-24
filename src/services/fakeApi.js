export const initialJobs = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      status: "Open",
      location: "Remote / San Francisco",
      jobType: "Full-time",
      salary: "$120k - $150k",
      applications: 24,
      applicationsLabel: "24 Applications",
      posted: "Posted 2 days ago",
    },
    {
      id: 2,
      title: "Product Designer",
      status: "Open",
      location: "New York, NY",
      jobType: "Contract",
      salary: "$80 - $100/hr",
      applications: 12,
      applicationsLabel: "12 Applicants",
      posted: "Posted 2 days ago",
    },
    {
      id: 3,
      title: "Marketing Manager",
      status: "Closed",
      location: "Chicago, IL",
      jobType: "Full-time",
      salary: "",
      applications: 24,
      applicationsLabel: "24 Applications",
      posted: "Posted 2 days ago",
    },
  ];
  
  export function getInitialJobs() {
    return [...initialJobs];
  }