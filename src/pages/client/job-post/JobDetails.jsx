import {
  ArrowLeftIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

import { jobFake } from "../../../data/jobDetailsFake";
export default function JobDetails() {
  const job = jobFake;

  return (
    <div className="min-h-screen bg-[#eef5f5] px-4 pt-[150px] sm:px-6 sm:pt-[155px] md:px-8 md:pt-[165px] lg:px-10 lg:pt-[175px]">
      <main className="mx-auto w-full max-w-[860px] rounded-[8px] bg-white px-6 py-7 sm:px-8 md:px-[30px] md:py-[26px]">
        <div className="mb-[16px] flex items-center gap-[16px]">
          <button type="button" onClick={() => window.history.back()}>
            <ArrowLeftIcon className="h-[20px] w-[20px] text-[#111827]" />
          </button>

          <h1 className="text-[18px] font-bold leading-tight text-[#111827] sm:text-[21px]">
            {job.title}
          </h1>
        </div>

        <div className="mb-[34px] flex flex-col gap-3 text-[14px] text-[#9aa3b2] sm:flex-row sm:flex-wrap sm:items-center sm:gap-[28px]">
          <div className="flex items-center gap-[9px]">
            <MapPinIcon className="h-[16px] w-[16px]" />
            <span>{job.location}</span>
          </div>

          <div className="flex items-center gap-[9px]">
            <ClockIcon className="h-[16px] w-[16px]" />
            <span>{job.jobType}</span>
          </div>

          <div className="flex items-center gap-[9px]">
            <CurrencyDollarIcon className="h-[16px] w-[16px]" />
            <span>{job.salary}</span>
          </div>
        </div>

        <p className="mb-[34px] max-w-[560px] text-[14px] leading-[1.35] text-[#9aa3b2] sm:text-[15px]">
          {job.description}
        </p>

        <div className="mb-[34px] flex flex-wrap gap-[14px]">
          {job.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-[7px] bg-[#f1f2f5] px-[15px] py-[7px] text-[14px] text-[#4b5563]"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="grid w-full grid-cols-1 gap-4 sm:max-w-[430px] sm:grid-cols-2 sm:gap-[28px]">
          <div className="flex min-h-[74px] flex-col items-center justify-center rounded-[6px] bg-[#f3f4f6] text-center">
            <p className="text-[16px] font-bold text-[#111827]">
              {job.applicationsCount}
            </p>
            <p className="text-[14px] text-[#374151]">Total Applications</p>
          </div>

          <div className="flex min-h-[74px] flex-col items-center justify-center rounded-[6px] bg-[#f3f4f6] text-center">
            <span className="rounded-full bg-[#dcfce7] px-[16px] py-[3px] text-[13px] text-[#16a34a]">
              {job.status}
            </span>
            <p className="mt-[6px] text-[14px] text-[#374151]">Job Status</p>
          </div>
        </div>
      </main>
    </div>
  );
}