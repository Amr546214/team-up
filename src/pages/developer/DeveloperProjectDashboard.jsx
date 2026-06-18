import { useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DeveloperLayout from "../../layouts/DeveloperLayout";
import Header from "../../components/common/Header";
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  Upload,
  MessageSquare,
  MoreVertical,
  Clock,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Layout,
  X,
} from "lucide-react";

const DeveloperProjectDashboard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  // Fake static data
  const projectInfo = {
    id: id || "1",
    title: "E-commerce API Integration",
    status: "Active",
    deadline: "Oct 24, 2026",
    progress: 65,
  };

  const [kanbanData, setKanbanData] = useState([
    {
      title: "To Do",
      tasks: [
        { id: 1, title: "Database Schema Design", desc: "Design the initial schema for e-commerce products.", assignee: "Sara M.", priority: "High", date: "Oct 10" },
        { id: 2, title: "Auth Middleware", desc: "Implement JWT authentication for API routes.", assignee: "Hanan M.", priority: "Medium", date: "Oct 12" },
      ],
    },
    {
      title: "In Progress",
      tasks: [
        { id: 3, title: "Product API Endpoints", desc: "Create GET, POST, PUT for products.", assignee: "Hanan M.", priority: "High", date: "Oct 15" },
        { id: 4, title: "Search Functionality", desc: "Implement full-text search using ElasticSearch.", assignee: "Alex J.", priority: "Low", date: "Oct 18" },
      ],
    },
    {
      title: "In Review",
      tasks: [
        { id: 5, title: "Checkout Flow", desc: "Review the payment gateway integration.", assignee: "Hanan M.", priority: "High", date: "Oct 08" },
        { id: 6, title: "Cloudinary Setup", desc: "Image upload handling for product gallery.", assignee: "Alex J.", priority: "Medium", date: "Oct 09" },
      ],
    },
    {
      title: "Done",
      tasks: [
        { id: 7, title: "Project Setup", desc: "Initial repository setup and boilerplate.", assignee: "Hanan M.", priority: "Low", date: "Sep 25" },
        { id: 8, title: "API Documentation", desc: "Swagger UI setup for API testing.", assignee: "Sara M.", priority: "Medium", date: "Sep 30" },
      ],
    },
  ]);

  const [recentUpdates, setRecentUpdates] = useState([
    { user: "Hanan M.", action: "moved task to Done", task: "API Documentation", time: "2 hours ago" },
    { user: "Sara M.", action: "commented on", task: "Database Schema Design", time: "5 hours ago" },
    { user: "Alex J.", action: "uploaded 3 files to", task: "Search Functionality", time: "1 day ago" },
  ]);

  const overviewStats = useMemo(() => {
    const total = kanbanData.reduce((acc, col) => acc + col.tasks.length, 0);
    const getCount = (title) => kanbanData.find(c => c.title === title)?.tasks.length || 0;
    
    return [
      { label: "Total Tasks", value: total, icon: Layout, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "To Do", value: getCount("To Do"), icon: Clock, color: "text-gray-600", bg: "bg-gray-50" },
      { label: "In Progress", value: getCount("In Progress"), icon: Clock3, color: "text-amber-600", bg: "bg-amber-50" },
      { label: "In Review", value: getCount("In Review"), icon: AlertCircle, color: "text-purple-600", bg: "bg-purple-50" },
      { label: "Done", value: getCount("Done"), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    ];
  }, [kanbanData]);

  const teamMembers = [
    { name: "Hanan Muhammed", role: "Lead Backend", initials: "HM", status: "Online" },
    { name: "Sara Muhammed", role: "Database Eng", initials: "SM", status: "Busy" },
    { name: "Alex Johnson", role: "Frontend Dev", initials: "AJ", status: "Offline" },
  ];

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: "",
    desc: "",
    assignee: "Hanan M.",
    priority: "Medium",
    date: "",
    status: "To Do"
  });

  const [teamMessage, setTeamMessage] = useState("");

  const handleOpenTaskModal = (status = "To Do") => {
    setNewTask(prev => ({ ...prev, status }));
    setIsTaskModalOpen(true);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const taskToAdd = {
      id: Date.now(),
      ...newTask,
      date: newTask.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    setKanbanData(prev => prev.map(col => {
      if (col.title === newTask.status) {
        return { ...col, tasks: [taskToAdd, ...col.tasks] };
      }
      return col;
    }));

    setIsTaskModalOpen(false);
    setNewTask({
      title: "",
      desc: "",
      assignee: "Hanan M.",
      priority: "Medium",
      date: "",
      status: "To Do"
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!teamMessage.trim()) return;

    const update = {
      user: "Current User",
      action: "sent a team message",
      task: "",
      time: "Just now"
    };

    setRecentUpdates(prev => [update, ...prev]);
    setTeamMessage("");
    setIsMessageModalOpen(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const update = {
        user: "Current User",
        action: `uploaded ${file.name}`,
        task: "",
        time: "Just now"
      };
      setRecentUpdates(prev => [update, ...prev]);
    }
  };

  return (
    <DeveloperLayout>
      <Header />
      <div className="min-h-screen bg-[#F5F9F9] mt-15 p-4 md:p-6 ml-[240px]">
        <div className="max-w-[1200px] mx-auto pb-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition shrink-0"
              >
                <ArrowLeft size={20} className="text-[#111827]" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#111827]">{projectInfo.title}</h1>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    {projectInfo.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                    <CalendarDays size={16} />
                    Deadline: {projectInfo.deadline}
                  </span>
                  <div className="flex items-center gap-2 min-w-[150px]">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B6F6C] rounded-full"
                        style={{ width: `${projectInfo.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-[#0B6F6C]">{projectInfo.progress}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#374151] hover:bg-gray-50 transition"
              >
                <Upload size={16} />
                Upload File
              </button>
              <button 
                onClick={() => setIsMessageModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#374151] hover:bg-gray-50 transition"
              >
                <MessageSquare size={16} />
                Message Team
              </button>
              <button 
                onClick={() => handleOpenTaskModal()}
                className="flex items-center gap-2 px-4 py-2 bg-[#0B6F6C] text-white rounded-xl text-sm font-medium hover:bg-[#095c5a] transition shadow-sm"
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Overview Stats */}
            <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-5 gap-4">
              {overviewStats.map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm">
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-sm text-[#6B7280]">{stat.label}</p>
                  <p className="text-xl font-bold text-[#111827] mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Main Content - Kanban Board */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {kanbanData.map((column, idx) => (
                  <div key={idx} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="font-bold text-[#111827] flex items-center gap-2">
                        {column.title}
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-normal">
                          {column.tasks.length}
                        </span>
                      </h3>
                      <MoreVertical size={16} className="text-[#9CA3AF] cursor-pointer" />
                    </div>
                    <div className="space-y-4">
                      {column.tasks.map((task) => (
                        <div key={task.id} className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition group cursor-default">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              task.priority === 'High' ? 'bg-red-50 text-red-600' :
                              task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-[#9CA3AF]">{task.date}</span>
                          </div>
                          <h4 className="font-semibold text-[#111827] text-sm group-hover:text-[#0B6F6C] transition">{task.title}</h4>
                          <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{task.desc}</p>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700 border border-white">
                                {task.assignee.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-[10px] text-[#4B5563] font-medium">{task.assignee}</span>
                            </div>
                            <div className="flex -space-x-2">
                              {/* Small placeholder for more info if needed */}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => handleOpenTaskModal(column.title)}
                        className="w-full py-2 border-2 border-dashed border-[#E5E7EB] rounded-xl text-[#9CA3AF] text-sm font-medium hover:bg-gray-50 hover:border-[#D1D5DB] transition flex items-center justify-center gap-1"
                      >
                        <Plus size={16} />
                        Add Task
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar - Team, Updates */}
            <div className="lg:col-span-1 space-y-6">
              {/* Team Members */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                <h3 className="font-bold text-[#111827] mb-4">Team Members</h3>
                <div className="space-y-4">
                  {teamMembers.map((member, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0B6F6C] text-white flex items-center justify-center font-bold text-sm">
                          {member.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">{member.name}</p>
                          <p className="text-xs text-[#6B7280]">{member.role}</p>
                        </div>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${
                        member.status === 'Online' ? 'bg-green-500' :
                        member.status === 'Busy' ? 'bg-amber-500' : 'bg-gray-300'
                      }`}></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Updates */}
              <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                <h3 className="font-bold text-[#111827] mb-4">Recent Updates</h3>
                <div className="space-y-4">
                  {recentUpdates.map((update, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1 h-auto bg-[#E5E7EB] rounded-full shrink-0"></div>
                      <div>
                        <p className="text-xs text-[#6B7280]">
                          <span className="font-semibold text-[#111827]">{update.user}</span> {update.action} <span className="font-medium text-[#0B6F6C]">{update.task}</span>
                        </p>
                        <p className="text-[10px] text-[#9CA3AF] mt-1">{update.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-[#E5E7EB] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-bold text-[#111827]">Add New Task</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-[#6B7280] hover:text-[#111827] transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6F6C]/20 focus:border-[#0B6F6C] transition"
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Description</label>
                <textarea
                  value={newTask.desc}
                  onChange={(e) => setNewTask({ ...newTask, desc: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6F6C]/20 focus:border-[#0B6F6C] transition min-h-[100px]"
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Assignee</label>
                  <select
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6F6C]/20 focus:border-[#0B6F6C] transition"
                  >
                    {teamMembers.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6F6C]/20 focus:border-[#0B6F6C] transition"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6F6C]/20 focus:border-[#0B6F6C] transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6F6C]/20 focus:border-[#0B6F6C] transition"
                  >
                    {kanbanData.map(col => <option key={col.title} value={col.title}>{col.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-[#E5E7EB] text-[#374151] rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#0B6F6C] text-white rounded-xl font-medium hover:bg-[#095c5a] transition shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-[#E5E7EB] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
              <h2 className="text-xl font-bold text-[#111827]">Message Team</h2>
              <button onClick={() => setIsMessageModalOpen(false)} className="text-[#6B7280] hover:text-[#111827] transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Your Message *</label>
                <textarea
                  required
                  value={teamMessage}
                  onChange={(e) => setTeamMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B6F6C]/20 focus:border-[#0B6F6C] transition min-h-[150px]"
                  placeholder="Type your message to the team..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-[#E5E7EB] text-[#374151] rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#0B6F6C] text-white rounded-xl font-medium hover:bg-[#095c5a] transition shadow-sm"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DeveloperLayout>
  );
};

export default DeveloperProjectDashboard;

