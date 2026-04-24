import { useNavigate } from "react-router-dom";

/**
 * NotFound page displayed when user navigates to an unknown route.
 * Provides helpful navigation options instead of a blank screen.
 */
const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="not-found-actions">
          <button type="button" className="primary-btn" onClick={handleGoHome}>
            Go Home
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={handleGoBack}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
