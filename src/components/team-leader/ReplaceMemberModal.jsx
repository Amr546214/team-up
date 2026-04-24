import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

function ReplaceMemberModal({
  isOpen,
  onClose,
  memberToReplace,
  replaceOptions,
  onConfirmReplace,
}) {
  const [selectedId, setSelectedId] = useState("");

  if (!isOpen || !memberToReplace) return null;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedId) return;

    const selectedMember = replaceOptions.find(
      (member) => member.id === Number(selectedId)
    );

    if (selectedMember) {
      onConfirmReplace(memberToReplace.id, selectedMember);
      setSelectedId("");
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="custom-modal">
        <div className="modal-header">
          <h3>Replace Member</h3>

          <button type="button" className="close-btn" onClick={onClose}>
            <XMarkIcon className="close-icon" />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="replace-note">
            Replacing: <strong>{memberToReplace.name}</strong>
          </div>

          <div className="form-group">
            <label>Select Replacement</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">Choose member</option>
              {replaceOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.role}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="primary-btn">
              Confirm Replace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReplaceMemberModal;