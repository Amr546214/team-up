import React from "react";
import { useAuth } from "../../hooks/useAuth";

/**
 * AdminDashboard - Temporary admin dashboard page
 * 
 * This is a placeholder admin dashboard for users with role="admin".
 * Full admin features to be implemented later.
 */
function AdminDashboard() {
  const { user, userRole } = useAuth();

  // Get user display info
  const userName = user?.full_name || user?.name || user?.email || "Admin";
  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {userName}!
          </p>
        </div>

        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Administrator Access
          </h2>
          <p className="text-gray-600 mb-4">
            You are logged in as an <span className="font-medium text-blue-600">admin</span>.
          </p>
          {userEmail && (
            <p className="text-sm text-gray-500">
              Email: {userEmail}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Role: {userRole}
          </p>
        </div>

        {/* Placeholder for future admin features */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Coming Soon
          </h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>User management</li>
            <li>System analytics</li>
            <li>Configuration settings</li>
            <li>Content moderation</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          TeamUP Admin Dashboard • Temporary Version
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
