function EvaluationCard({ evaluation, onRate }) {
  return (
    <div className="evaluation-card">
      <div className="evaluation-top">
        <div className="evaluation-user">
          <div className="avatar-circle small"></div>
          <h4>{evaluation.name}</h4>
        </div>

        <div className="evaluation-stars">
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1;

            return (
              <button
                key={index}
                type="button"
                className="star-btn"
                onClick={() => onRate(evaluation.id, starValue)}
                aria-label={`Rate ${starValue} stars`}
              >
                <span
                  className={starValue <= evaluation.rating ? "star filled" : "star"}
                >
                  ★
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="evaluation-comment">{evaluation.comment}</p>
    </div>
  );
}

export default EvaluationCard;