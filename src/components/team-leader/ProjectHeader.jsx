import { ArrowLeftIcon } from "@heroicons/react/24/outline";

function ProjectHeader({ project }) {
  return (
    <div className="project-header">
      <div className="project-header-top">
        <button type="button" className="back-btn" aria-label="Back">
          <ArrowLeftIcon className="back-icon" />
        </button>

        <h1 className="project-title">{project.title}</h1>
      </div>

      <div className="project-meta">
        <span className="project-status">
          <span className="status-dot"></span>
          {project.status}
        </span>

        <span className="project-company">{project.company}</span>
      </div>
    </div>
  );
}

export default ProjectHeader;