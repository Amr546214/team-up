import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/common/Header";

import {
  ChevronDown,
  Upload,
  X,
  Plus,
  Landmark,
  CreditCard,
  Crown,
  Star,
} from "lucide-react";

function ClientProfile() {
  const navigate = useNavigate();
  const countryCodes = {
    Egypt: "+20",
    "Saudi Arabia": "+966",
    UAE: "+971",
    Jordan: "+962",
    Kuwait: "+965",
    Qatar: "+974",
    Bahrain: "+973",
    Oman: "+968",
  };

  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    email: "",
    phoneNumber: "",
    country: "Egypt",
    bio: "",
    photo: null,
  });

  const [savedProfile, setSavedProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(true);

  const [showAdditionalInfo, setShowAdditionalInfo] = useState(true);
  const [phoneCode, setPhoneCode] = useState("+20");

  const [paymentMethods, setPaymentMethods] = useState([
    "Bank Account",
    "PayPal",
  ]);

  const [accountDetails] = useState({
    accountType: "Client",
    totalTeamsBuilt: 30,
    averageRating: 4.6,
    clientRanking: "Gold",
  });

  const [billingHistory] = useState([
    {
      projectName: "E-commerce platform",
      status: "Completed",
      teamSize: "5 developer",
      rating: 3,
      action: "View Details",
    },
    {
      projectName: "Mobile Add Development",
      status: "Ongoing",
      teamSize: "8 developer",
      rating: 0,
      action: "View Details",
    },
  ]);

  const [feedbackRates] = useState({
    overallScore: 4.8,
    communication: 4,
    timelyPayments: 3,
    clarityOfRequirements: 5,
    professionalism: 5,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "country") {
      setFormData((prev) => ({
        ...prev,
        country: value,
      }));
      setPhoneCode(countryCodes[value] || "");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo: URL.createObjectURL(file),
      }));
    }
  };

  const handleSaveProfile = () => {
    setSavedProfile({
      ...formData,
      phoneCode,
    });
    setIsEditing(false);
    alert("Profile saved successfully!");
  };

  const handleEditProfile = () => {
    if (savedProfile) {
      setFormData({
        fullName: savedProfile.fullName || "",
        userName: savedProfile.userName || "",
        email: savedProfile.email || "",
        phoneNumber: savedProfile.phoneNumber || "",
        country: savedProfile.country || "Egypt",
        bio: savedProfile.bio || "",
        photo: savedProfile.photo || null,
      });
      setPhoneCode(savedProfile.phoneCode || "+20");
    }
    setIsEditing(true);
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this profile?"
    );

    if (confirmDelete) {
      setFormData({
        fullName: "",
        userName: "",
        email: "",
        phoneNumber: "",
        country: "Egypt",
        bio: "",
        photo: null,
      });
      setSavedProfile(null);
      setIsEditing(true);
      setPhoneCode("+20");
      setPaymentMethods([]);
    }
  };

  const handleAddPaymentMethod = () => {
    const method = window.prompt(
      "Enter payment method name (example: Vodafone Cash)"
    );

    if (!method || !method.trim()) return;

    setPaymentMethods((prev) => [...prev, method.trim()]);
  };

  const handleRemovePaymentMethod = (methodToRemove) => {
    setPaymentMethods((prev) =>
      prev.filter((method) => method !== methodToRemove)
    );
  };

  const handleChangePassword = () => {
    alert("Navigate to change password page");
  };

  const getPaymentIcon = (method) => {
    const lowerMethod = method.toLowerCase();

    if (lowerMethod.includes("bank")) {
      return <Landmark size={18} className="text-[#667085]" />;
    }

    return <CreditCard size={18} className="text-[#667085]" />;
  };

  const renderStars = (count, size = 18) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= count
                ? "fill-[#F4C518] text-[#F4C518]"
                : "fill-[#8C8C8C] text-[#8C8C8C]"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Header />
    <div className="min-h-screen bg-[#F5FAFA] px-6 py-10 mt-[72px]">
      <div className="max-w-[980px] mx-auto bg-white rounded-[12px] border border-[#E5E7EB] p-8 md:p-9">
        <h1 className="text-[18px] font-semibold text-[#111827]">
          Personal Information
        </h1>

        <p className="mt-2 text-[14px] text-[#6B7280]">
          Basic details to identify and manage your account.
        </p>

        {isEditing ? (
          <>
            <div className="mt-8 flex items-center gap-5">
              <div className="w-[72px] h-[72px] rounded-full bg-[#D9D9D9] overflow-hidden flex items-center justify-center">
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              <label className="flex items-center gap-2 text-[14px] text-[#0B6B63] cursor-pointer">
                <Upload size={16} />
                Upload New Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-[14px] font-medium text-black mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Hanan Muhammed"
                  className="w-full h-[48px] rounded-[10px] border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-black mb-2">
                  User Name
                </label>
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleChange}
                  placeholder="Hanan Muhammed6686"
                  className="w-full h-[48px] rounded-[10px] border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
                />
              </div>
            </div>

            <div className="mt-9 border border-[#E5E7EB] rounded-[10px] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                className="w-full h-[52px] bg-[#F5FAFA] px-5 flex items-center justify-between text-left text-[14px] text-black"
              >
                <span>Additional information</span>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${
                    showAdditionalInfo ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAdditionalInfo && (
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <div>
                      <label className="block text-[14px] font-medium text-black mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Hanan Muhammed@example.com"
                        className="w-full h-[48px] rounded-[10px] border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
                      />
                    </div>

                    <div>
                      <label className="block text-[14px] font-medium text-black mb-2">
                        Phone Number
                      </label>
                      <div className="flex items-center w-full h-[48px] rounded-[10px] border border-[#D1D5DB] overflow-hidden focus-within:border-[#0B6B63]">
                        <div className="px-4 text-[14px] text-[#6B7280] border-r border-[#D1D5DB] bg-[#FAFAFA] h-full flex items-center">
                          {phoneCode}
                        </div>
                        <input
                          type="text"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="12345678"
                          className="w-full h-full px-4 text-[14px] outline-none placeholder:text-[#A3A3A3]"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[14px] font-medium text-black mb-2">
                        Country
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full h-[48px] rounded-[10px] border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B6B63] bg-white"
                      >
                        <option value="Egypt">Egypt</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="UAE">UAE</option>
                        <option value="Jordan">Jordan</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Oman">Oman</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[14px] font-medium text-black mb-2">
                        Bio (optional)
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about your self"
                        rows="2"
                        className="w-full h-[78px] rounded-[10px] border border-[#D1D5DB] px-4 py-3 text-[14px] outline-none resize-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-8 border border-[#E5E7EB] rounded-[10px] p-6">
            <div className="flex items-center gap-5">
              <div className="w-[72px] h-[72px] rounded-full bg-[#D9D9D9] overflow-hidden flex items-center justify-center">
                {savedProfile?.photo ? (
                  <img
                    src={savedProfile.photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              <div>
                <h3 className="text-[20px] font-semibold text-[#111827]">
                  {savedProfile?.fullName || "No Name"}
                </h3>
                <p className="mt-1 text-[14px] text-[#6B7280]">
                  @{savedProfile?.userName || "No Username"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <p className="text-[13px] text-[#6B7280] mb-2">Email</p>
                <p className="text-[15px] text-[#111827]">
                  {savedProfile?.email || "-"}
                </p>
              </div>

              <div>
                <p className="text-[13px] text-[#6B7280] mb-2">Phone Number</p>
                <p className="text-[15px] text-[#111827]">
                  {savedProfile?.phoneCode} {savedProfile?.phoneNumber || "-"}
                </p>
              </div>

              <div>
                <p className="text-[13px] text-[#6B7280] mb-2">Country</p>
                <p className="text-[15px] text-[#111827]">
                  {savedProfile?.country || "-"}
                </p>
              </div>

              <div>
                <p className="text-[13px] text-[#6B7280] mb-2">Bio</p>
                <p className="text-[15px] text-[#111827] break-words">
                  {savedProfile?.bio || "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center gap-5">
          {isEditing ? (
            <button
              type="button"
              onClick={handleSaveProfile}
              className="min-w-[140px] h-[48px] rounded-[10px] bg-[#0B6B63] text-white text-[16px] font-medium hover:opacity-90 transition"
            >
              Save
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEditProfile}
              className="min-w-[140px] h-[48px] rounded-[10px] bg-[#0B6B63] text-white text-[16px] font-medium hover:opacity-90 transition"
            >
              Edit Profile
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="min-w-[140px] h-[48px] rounded-[10px] border border-[#FF3B30] text-[#FF3B30] text-[16px] font-medium hover:bg-red-50 transition"
          >
            Delete
          </button>
        </div>

        <div className="mt-8 border-t border-[#E5E7EB]" />

        <div className="pt-8">
          <h2 className="text-[18px] font-semibold text-[#111827]">
            Account Details
          </h2>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FBFBFB] rounded-[12px] p-5 flex flex-col items-center justify-center min-h-[96px]">
              <span className="px-5 py-1 rounded-[10px] bg-[#0B6B63] text-white text-[14px] font-medium">
                {accountDetails.accountType}
              </span>
              <p className="mt-3 text-[15px] text-[#667085]">Account Type</p>
            </div>

            <div className="bg-[#FBFBFB] rounded-[12px] p-5 flex flex-col items-center justify-center min-h-[96px]">
              <h3 className="text-[22px] font-semibold text-[#111827]">
                {accountDetails.totalTeamsBuilt}
              </h3>
              <p className="mt-1 text-[15px] text-[#667085]">Total Teams Built</p>
            </div>

            <div className="bg-[#FBFBFB] rounded-[12px] p-5 flex flex-col items-center justify-center min-h-[96px]">
              <h3 className="text-[22px] font-semibold text-[#111827]">
                {accountDetails.averageRating}
              </h3>
              <p className="mt-1 text-[15px] text-[#667085]">Average Rating</p>
            </div>

            <div className="bg-[#FBFBFB] rounded-[12px] p-5 flex flex-col items-center justify-center min-h-[96px]">
              <div className="flex items-center gap-2 text-[#D4A017]">
                <Crown size={18} />
                <span className="text-[22px] font-semibold text-[#111827]">
                  {accountDetails.clientRanking}
                </span>
              </div>
              <p className="mt-1 text-[15px] text-[#667085]">Client Ranking</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E5E7EB]" />

        <div className="pt-8">
          <h2 className="text-[18px] font-semibold text-[#111827]">
            Payment & Billing information
          </h2>

          <div className="mt-7 space-y-5">
            {paymentMethods.map((method, index) => (
              <div
                key={index}
                className="h-[56px] rounded-[10px] border border-[#E5E7EB] px-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getPaymentIcon(method)}
                  <span className="text-[16px] text-[#475467]">{method}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePaymentMethod(method)}
                  className="text-[#FF3B30] text-[16px] font-medium hover:opacity-80"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddPaymentMethod}
            className="mt-6 min-w-[150px] h-[44px] px-4 rounded-[10px] border border-[#0B6B63] text-[#0B6B63] text-[15px] font-medium hover:bg-[#F5FAFA] transition"
          >
            Add Payment Method
          </button>
        </div>

        <div className="mt-8 border-t border-[#E5E7EB]" />

        <div className="pt-8">
          <h2 className="text-[18px] font-semibold text-[#111827]">
            Billing History
          </h2>

          <div className="mt-7 overflow-x-auto">
            <div className="min-w-[760px] rounded-[12px] border border-[#DADADA] overflow-hidden">
              <div className="grid grid-cols-5 bg-white text-[#667085] text-[15px] border-b border-[#E5E7EB]">
                <div className="px-6 py-5">Project Name</div>
                <div className="px-6 py-5">Status</div>
                <div className="px-6 py-5">Team Size</div>
                <div className="px-6 py-5">Rating</div>
                <div className="px-6 py-5">Action</div>
              </div>

              {billingHistory.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-5 bg-white text-[15px] border-b last:border-b-0 border-[#E5E7EB] items-center"
                >
                  <div className="px-6 py-5 text-[#0B6B63]">{item.projectName}</div>

                  <div className="px-6 py-5">
                    <span
                      className={`inline-flex items-center justify-center px-4 h-[28px] rounded-full text-[13px] font-medium ${
                        item.status === "Completed"
                          ? "bg-[#DDF6E7] text-[#32A071]"
                          : "bg-[#DCE8FF] text-[#4A7CFF]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="px-6 py-5 text-[#111827]">{item.teamSize}</div>

                  <div className="px-6 py-5">
                    {item.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((star) => (
                          <Star
                            key={star}
                            size={20}
                            className="fill-[#F4C518] text-[#F4C518]"
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#98A2B3] text-[22px]">—</span>
                    )}
                  </div>

                  <div className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => navigate(`/client/job/${index + 1}`)}
                      className="text-[#0B6B63] text-[15px] font-medium hover:opacity-80"
                    >
                      {item.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E5E7EB]" />

        <div className="pt-8">
          <h2 className="text-[18px] font-semibold text-[#111827]">
            Rates & Feedback
          </h2>

          <p className="mt-2 text-[14px] text-[#667085]">
            Show how developers rate working with you
          </p>

          <div className="mt-10 flex flex-col items-center">
            <h3 className="text-[56px] leading-none font-semibold text-[#111827]">
              {feedbackRates.overallScore}
            </h3>

            <div className="mt-6">{renderStars(5, 24)}</div>

            <p className="mt-5 text-[18px] text-[#475467]">
              Overall Client Score
            </p>
          </div>

          <div className="mt-12 max-w-[860px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-y-7">
            <div className="text-[18px] text-[#667085]">Communication</div>
            <div className="md:justify-self-end">
              {renderStars(feedbackRates.communication, 22)}
            </div>

            <div className="text-[18px] text-[#667085]">Timely Payments</div>
            <div className="md:justify-self-end">
              {renderStars(feedbackRates.timelyPayments, 22)}
            </div>

            <div className="text-[18px] text-[#667085]">Clarity of Requirements</div>
            <div className="md:justify-self-end">
              {renderStars(feedbackRates.clarityOfRequirements, 22)}
            </div>

            <div className="text-[18px] text-[#667085]">Professionalism</div>
            <div className="md:justify-self-end">
              {renderStars(feedbackRates.professionalism, 22)}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E5E7EB]" />

        <div className="pt-8">
          <h2 className="text-[18px] font-semibold text-[#111827]">
            Jobs Management
          </h2>

          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/client/my-jobs")}
              className="px-6 h-[44px] rounded-[10px] border border-[#0B6B63] text-[#0B6B63] text-[15px] font-medium hover:bg-[#F5FAFA] transition"
            >
              My Jobs
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E5E7EB]" />

        <div className="pt-8">
          <h2 className="text-[18px] font-semibold text-[#111827]">
            Security Settings
          </h2>

          <div className="mt-7 flex items-center justify-between">
            <p className="text-[18px] text-[#111827]">Change Password</p>

            <button
              type="button"
              onClick={handleChangePassword}
              className="text-[#0B6B63] text-[18px] font-medium hover:opacity-80"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}

export default ClientProfile;