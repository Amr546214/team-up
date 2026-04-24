import React, { memo } from "react";
import { Code2, Database, Cpu, PencilRuler } from "lucide-react";

// Icon mapping
const ICON_COMPONENTS = {
  code: Code2,
  database: Database,
  brain: Cpu,
  design: PencilRuler,
};

const TrackIcon = memo(({ iconName }) => {
  const IconComponent = ICON_COMPONENTS[iconName] || Code2;
  return <IconComponent size={15} strokeWidth={2} />;
});

const TrackCard = ({ track, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(track.id)}
      className={`w-full text-left rounded-xl border p-4 transition ${
        isSelected
          ? "border-teal-600 bg-teal-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      {/* Top */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-lg ${
            track.icon === "code"
              ? "bg-blue-100 text-blue-600"
              : track.icon === "database"
              ? "bg-green-100 text-green-600"
              : track.icon === "brain"
              ? "bg-purple-100 text-purple-600"
              : track.icon === "design"
              ? "bg-pink-100 text-pink-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <TrackIcon iconName={track.icon} />
        </div>

        {/* Radio */}
        <span
          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
            isSelected
              ? "border-teal-600"
              : "border-gray-300"
          }`}
        >
          {isSelected && (
            <span className="w-2 h-2 bg-teal-600 rounded-full"></span>
          )}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-900">
        {track.title}
      </h3>

      {/* Description */}
      <p className="mt-1 text-xs text-gray-500 leading-relaxed">
        {track.description}
      </p>
    </button>
  );
};

export default memo(TrackCard);