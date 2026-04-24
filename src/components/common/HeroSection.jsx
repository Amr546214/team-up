import React from 'react';

const HeroSection = () => {
  return (
    <div className="flex-1 flex flex-col justify-center px-12">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        Builder Your <span className="text-teal-600">Dream Team</span> .
      </h1>
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Work Smarter Together.
      </h1>

      <p className="text-gray-600 text-lg mb-8 max-w-lg leading-relaxed">
        TeamUp Connects Freelancers, developers, designers, and companies- giving you The Tooles To Creat Complete project teams
      </p>

  <div className="flex gap-4 mt-6">

    {/* Get Started */}
        <a href="#"className="w-[190px] py-2 bg-[#0B6F6C] text-white rounded-md hover:bg-[#15807d] transition font-medium flex items-center justify-center cursor-pointer">
             Get Started
        </a>

    {/* Learn More */}
        <a href="#" className="w-[190px] py-2 border border-[#0B6F6C] text-[#0B6F6C] rounded-md hover:bg-[#e6f3f2] transition font-medium flex items-center justify-center cursor-pointer">
             Learn More
        </a>

  </div>
    </div>
  );
};

export default HeroSection;
