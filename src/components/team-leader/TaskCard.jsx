import { CalendarDaysIcon } from "@heroicons/react/24/outline";

function TaskCard({ task }) {
  return (
    <div className="task-card">
      <div className="task-badges">
        <span className={`badge badge-priority ${task.priorityType}`}>
          {task.priority}
        </span>

        <span className={`badge badge-status ${task.statusType}`}>
          {task.status}
        </span>
      </div>

      <h3 className="task-title">{task.title}</h3>

      <p className="task-description">{task.description}</p>

      <div className="task-footer">
        <div className="task-assignee">
          <div className="avatar-circle"></div>
          <span>{task.assignee}</span>
        </div>

        <div className="task-deadline">
          <CalendarDaysIcon className="deadline-icon" />
          <span>Deadline: {task.deadline}</span>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;