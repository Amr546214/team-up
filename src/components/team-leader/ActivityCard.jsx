import { CheckCircleIcon } from "@heroicons/react/24/outline";

function ActivityCard({ activity }) {
  return (
    <div className="activity-card">
      <div className="activity-left">
        <div className="activity-check-wrap">
          <CheckCircleIcon className="activity-check-icon" />
        </div>

        <div className="activity-text">
          <div className="activity-head">
            <h4>{activity.title}</h4>
            <span>{activity.time}</span>
          </div>

          <p>{activity.description}</p>
        </div>
      </div>
    </div>
  );
}

export default ActivityCard;