import DeveloperSidebar from "../components/common/DeveloperSidebar";

function DeveloperLayout({ children }) {
  return (
    <div className="flex">
      <DeveloperSidebar />

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

export default DeveloperLayout;