import {
  EyeIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

function TeamMemberCard({ member, onViewProfile, onReplaceMember }) {
  return (
    <div className="team-member-card">
      <div
        className="team-member-left clickable"
        onClick={() => onViewProfile(member)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") onViewProfile(member);
        }}
      >
        <div className="avatar-circle large"></div>

        <div className="team-member-text">
          <h4>{member.name}</h4>

          <div className="team-member-meta">
            <span>{member.role}</span>
            <span>{member.level}</span>
          </div>
        </div>
      </div>

      <div className="team-member-actions">
        <button
          type="button"
          className="icon-action-btn"
          aria-label="View Profile"
          onClick={() => onViewProfile(member)}
        >
          <EyeIcon className="mini-icon" />
        </button>

        <button
          type="button"
          className="icon-action-btn"
          aria-label="Replace Member"
          onClick={() => onReplaceMember(member)}
        >
          <ArrowsRightLeftIcon className="mini-icon" />
        </button>
      </div>
    </div>
  );
}

export default TeamMemberCard;