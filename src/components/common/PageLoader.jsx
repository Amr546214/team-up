/**
 * PageLoader component shown during lazy loading or async operations.
 * Prevents blank white screen while content is loading.
 */
const PageLoader = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#0f766e]" />
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  );
};

export default PageLoader;