function PublishingPreloader() {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#F5FAFA]/90 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-[20px] bg-white border border-[#D9EFEF] p-8 shadow-lg text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-[#D9EFEF] border-t-[#0B6B63] rounded-full animate-spin" />
          <div>
            <h3 className="text-[18px] font-semibold text-[#111827] mb-2">
              Analyzing your job requirements...
            </h3>
            <p className="text-[14px] text-[#6B7280]">
              Please wait while we find the best team match.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublishingPreloader;
