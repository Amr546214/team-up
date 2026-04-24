import React, { useMemo, useState, memo } from "react";
import TrackCard from "./TrackCard";

const TrackSelection = memo(({
  tracks,
  selectedTrack,
  onTrackSelect,
  onStartQuiz,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) =>
      track.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tracks, searchTerm]);

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <h2 className="text-xl font-semibold text-gray-900">
        Choose Your Track
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        Select the primary track you want
        <br />
        to be assessed on.
      </p>

      <input
        type="text"
        className="mt-4 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-teal-600"
        placeholder="search Tracks.."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filteredTracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            isSelected={selectedTrack === track.id}
            onSelect={onTrackSelect}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-6 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          onClick={onStartQuiz}
          disabled={!selectedTrack}
        >
          Start Quiz
        </button>
      </div>
    </section>
  );
});

export default TrackSelection;