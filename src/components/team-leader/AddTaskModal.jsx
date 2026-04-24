import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

function AddTaskModal({ isOpen, onClose, onAddTask, teamMembers }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priorityType: "medium",
    assigneeId: teamMembers[0]?.id || 1,
    deadlineMonth: "",
    deadlineDay: "",
    deadlineYear: "",
  });

  if (!isOpen) return null;

  const priorityMap = {
    high: "High Priority",
    medium: "Medium",
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priorityType: "medium",
      assigneeId: teamMembers[0]?.id || 1,
      deadlineMonth: "",
      deadlineDay: "",
      deadlineYear: "",
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const { title, description, deadlineMonth, deadlineDay, deadlineYear } = formData;

    if (
      !title.trim() ||
      !description.trim() ||
      !deadlineMonth ||
      !deadlineDay ||
      !deadlineYear
    ) {
      return;
    }

    const selectedMember = teamMembers.find(
      (member) => member.id === Number(formData.assigneeId)
    );

    const deadline = `${deadlineMonth} ${deadlineDay}, ${deadlineYear}`;

    onAddTask({
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      priorityType: formData.priorityType,
      priority: priorityMap[formData.priorityType],
      statusType: "todo",
      status: "To Do",
      assigneeId: Number(formData.assigneeId),
      assignee: selectedMember?.name || "Unknown",
      deadline,
    });

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="custom-modal">
        <div className="modal-header">
          <h3>Add New Task</h3>

          <button type="button" className="close-btn" onClick={handleClose}>
            <XMarkIcon className="close-icon" />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Priority</label>
              <select
                name="priorityType"
                value={formData.priorityType}
                onChange={handleChange}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
              </select>
            </div>

            <div className="form-group">
              <label>Assign To</label>
              <select
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Deadline</label>

            <div className="deadline-grid">
              <select
                name="deadlineMonth"
                value={formData.deadlineMonth}
                onChange={handleChange}
              >
                <option value="">Month</option>
                <option value="Jan">Jan</option>
                <option value="Feb">Feb</option>
                <option value="Mar">Mar</option>
                <option value="Apr">Apr</option>
                <option value="May">May</option>
                <option value="Jun">Jun</option>
                <option value="Jul">Jul</option>
                <option value="Aug">Aug</option>
                <option value="Sep">Sep</option>
                <option value="Oct">Oct</option>
                <option value="Nov">Nov</option>
                <option value="Dec">Dec</option>
              </select>

              <input
                type="number"
                min="1"
                max="31"
                name="deadlineDay"
                value={formData.deadlineDay}
                onChange={handleChange}
                placeholder="Day"
              />

              <input
                type="number"
                min="2025"
                max="2100"
                name="deadlineYear"
                value={formData.deadlineYear}
                onChange={handleChange}
                placeholder="Year"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={handleClose}>
              Cancel
            </button>

            <button type="submit" className="primary-btn">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;