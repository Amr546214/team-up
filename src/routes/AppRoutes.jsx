import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Home from "../pages/public/Home";
import NotFound from "../pages/public/NotFound";
import DeveloperDashboard from "../pages/developer/dashboard/DeveloperDashboard";
import TeamDashboard from "../pages/team-leader/TeamDashboard";
import JobDetails from "../pages/developer/jobs/JobDetails";
import SkillQuiz from "../pages/developer/skill-quiz/SkillQuiz";
import CompanyProfile from "../pages/company/dashboard/CompanyProfile";
import ClientProfile from "../pages/client/dashboard/ClientProfile";
import DevProfile from "../pages/developer/dashboard/DevProfile";
import PostNewJob from "../pages/client/job-post/PostNewJob";
import MyJobPosts from "../pages/client/job-post/MyJobPosts";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/team-leader/dashboard" element={<TeamDashboard />} />
      <Route path="/skill-quiz" element={<SkillQuiz />} />
      <Route path="/quiz" element={<SkillQuiz />} />
      <Route path="/quiz/:trackId" element={<SkillQuiz />} />

      {/* Auth-protected routes (demo only) */}
      <Route element={<PrivateRoute />}>
        <Route element={<RoleRoute role="developer" />}>
          <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
          <Route path="/developer/profile" element={<DevProfile />} />
          <Route path="/developer/projects" element={<JobDetails />} />
          <Route path="/developer/project/:id" element={<JobDetails />} />
          <Route path="/developer/jobs/:id/apply" element={<JobDetails />} />
          <Route path="/developer/proposals/:id" element={<JobDetails />} />
          <Route path="/developer/jobs/:id" element={<JobDetails />} />
        </Route>

        <Route element={<RoleRoute role="client" />}>
          <Route path="/client/profile" element={<ClientProfile />} />
          <Route path="/client/job-post" element={<PostNewJob />} />
          <Route path="/client/job/:id" element={<JobDetails />} />
          <Route path="/client/my-jobs" element={<MyJobPosts />} />
        </Route>

        <Route element={<RoleRoute role="company" />}>
          <Route path="/company/profile" element={<CompanyProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;