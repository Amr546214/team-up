import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AIBuildTeam = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state?.job;

  useEffect(() => {
    if (job) {
      navigate("/client/build-team/auto", {
        replace: true,
        state: { job },
      });
    } else {
      navigate("/client/build-team", { replace: true });
    }
  }, [job, navigate]);

  return null;
};

export default AIBuildTeam;
