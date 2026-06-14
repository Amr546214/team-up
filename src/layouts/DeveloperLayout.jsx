import DeveloperSidebar from "../components/common/DeveloperSidebar";

function DeveloperLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <div className="hidden lg:block">
        <DeveloperSidebar />
      </div>

      <main className="w-full">
        {children}
      </main>
    </div>
  );
}

export default DeveloperLayout;