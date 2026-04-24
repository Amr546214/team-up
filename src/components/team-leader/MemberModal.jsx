import { XMarkIcon } from "@heroicons/react/24/outline";

function MemberModal({ member, isOpen, onClose }) {
  if (!isOpen || !member) return null;

  return (
    <div className="modal-overlay">
      <div className="custom-modal member-modal">
        <div className="modal-header">
          <h3>Team Member Profile</h3>

          <button type="button" className="close-btn" onClick={onClose}>
            <XMarkIcon className="close-icon" />
          </button>
        </div>

        <div className="member-modal-content">
          <div className="member-modal-avatar"></div>

          <div className="member-modal-info">
            <h4>{member.name}</h4>
            <p>{member.role}</p>
            <span>{member.level}</span>
            <small>{member.email}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberModal;