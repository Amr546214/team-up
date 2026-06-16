import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/common/Header";
import {
  getAccessToken,
  saveUserProfile,
  dispatchAuthChanged,
} from "../../../utils/authStorage";

import {
  ChevronDown,
  Upload,
  Landmark,
  CreditCard,
  Crown,
  Star,
  Loader2,
} from "lucide-react";

const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

const COUNTRY_CODES = {
  Egypt: "+20",
  "Saudi Arabia": "+966",
  UAE: "+971",
  Jordan: "+962",
  Kuwait: "+965",
  Qatar: "+974",
  Bahrain: "+973",
  Oman: "+968",
};

const emptyForm = {
  fullName: "",
  userName: "",
  email: "",
  phoneNumber: "",
  country: "Egypt",
  bio: "",
  photo: null,
  skills: [],
  servicesWanted: [],
};

function ClientProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyForm);
  const [savedProfile, setSavedProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(true);
  const [phoneCode, setPhoneCode] = useState("+20");
  const [imageFile, setImageFile] = useState(null);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [accountDetails, setAccountDetails] = useState({
    accountType: "Client",
    totalTeamsBuilt: 0,
    averageRating: 0,
    clientRanking: "Bronze",
  });

  const [billingHistory, setBillingHistory] = useState([]);
  const [feedbackRates, setFeedbackRates] = useState({
    overallScore: 0,
    communication: 0,
    timelyPayments: 0,
    clarityOfRequirements: 0,
    professionalism: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const getAuthHeaders = () => {
    const token = getAccessToken();

    if (!token) {
      navigate("/login");
      throw new Error("No access token");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.message ||
      data?.error_message ||
      `Request failed with status ${res.status}`
    );
  }

  return data?.data || data;
};
  const normalizePaymentMethods = (data) => {
    const list = data?.data || data?.paymentMethods || data || [];
    if (!Array.isArray(list)) return [];

    return list.map((item) => {
      if (typeof item === "string") {
        return {
          _id: item,
          type: item.toLowerCase().includes("paypal") ? "paypal" : "bank",
          label: item,
        };
      }

      const type = item.type || "bank";
      const providerData = item.providerData || {};

      let label = "Payment Method";

      if (type === "paypal") {
        label = providerData.email || "PayPal";
      } else if (type === "bank") {
        label = providerData.bankName || "Bank Account";
      }

      return {
        ...item,
        _id: item._id || item.id,
        type,
        label,
      };
    });
  };

  const normalizeBillingHistory = (data) => {
    const list = data?.data || data?.history || data || [];
    if (!Array.isArray(list)) return [];

    return list.map((item, index) => ({
      id: item._id || item.id || index + 1,
      projectName: item.projectName || item.projectTitle || "Project",
      status: item.status || "Completed",
      teamSize: item.teamSize || item.developersCount || "-",
      rating: Number(item.rating || 0),
      action: "View Details",
    }));
  };

  const loadProfileData = async () => {
    setIsLoading(true);

    try {
      const [profileRes, paymentsRes, billingRes, ratingRes] =
        await Promise.allSettled([
          apiRequest("/client/profile"),
          apiRequest("/billing/payment-methods"),
          apiRequest("/billing/history"),
          apiRequest("/rating/client_rating"),
        ]);

 if (profileRes.status === "fulfilled") {
  const profileData = profileRes.value || {};
  const user = profileData.user || {};
  const clientProfile = profileData.clientProfile || profileData.profile || profileData;
  const accountSummary = profileData.accountSummary || {};

  const loadedProfile = {
    fullName: clientProfile.fullName || user.fullName || "",
    userName: clientProfile.userName || clientProfile.username || "",
    email: user.email || clientProfile.email || "",
    phoneNumber: String(clientProfile.phone || clientProfile.phoneNumber || "")
      .replace(COUNTRY_CODES[clientProfile.country || "Egypt"] || "+20", ""),
    country: clientProfile.country || "Egypt",
    bio: clientProfile.bio || "",
    photo:
      clientProfile.profileImage ||
      clientProfile.profilePicture ||
      clientProfile.photo ||
      "",
    skills: clientProfile.skills || [],
    servicesWanted: clientProfile.servicesWanted || [],
  };

  setFormData(loadedProfile);
  setSavedProfile({
    ...loadedProfile,
    phoneCode: COUNTRY_CODES[loadedProfile.country] || "+20",
  });
  setPhoneCode(COUNTRY_CODES[loadedProfile.country] || "+20");
  setIsEditing(false);

  setAccountDetails({
    accountType: "Client",
    totalTeamsBuilt: accountSummary.totalTeamsBuilt || 0,
    averageRating: accountSummary.averageRating || 0,
    clientRanking: accountSummary.ranking || "Bronze",
  });

  saveUserProfile({
    email: loadedProfile.email,
    role: "client",
    name: loadedProfile.fullName,
    avatarUrl: loadedProfile.photo,
  });

  dispatchAuthChanged();
}

      if (paymentsRes.status === "fulfilled") {
        setPaymentMethods(normalizePaymentMethods(paymentsRes.value));
      }

      if (billingRes.status === "fulfilled") {
        setBillingHistory(normalizeBillingHistory(billingRes.value));
      }

      if (ratingRes.status === "fulfilled") {
        const ratingData = ratingRes.value?.data || ratingRes.value || {};
        const breakdown = ratingData.breakdown || {};

        setFeedbackRates({
          overallScore: Number(ratingData.overallRating || 0),
          communication: Number(breakdown.communication || 0),
          timelyPayments: Number(breakdown.timelyPayments || 0),
          clarityOfRequirements: Number(breakdown.clarity || 0),
          professionalism: Number(breakdown.professionalism || 0),
        });
      }
    } catch (error) {
      console.error("Failed to load client profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "country") {
      setFormData((prev) => ({
        ...prev,
        country: value,
      }));
      setPhoneCode(COUNTRY_CODES[value] || "+20");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        photo: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadProfileImage = async () => {
    if (!imageFile) return null;

    const imageData = new FormData();
    imageData.append("image", imageFile);

    return await apiRequest("/user/profile-image", {
      method: "PATCH",
      body: imageData,
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      await apiRequest("/client/update-profile", {
      method: "PATCH",
      body: JSON.stringify({
      fullName: formData.fullName,
      phone: `${phoneCode}${formData.phoneNumber}`,
      country: formData.country,
      bio: formData.bio,
      servicesWanted: formData.servicesWanted || [],
      skills: formData.skills || [],
}),
      });

      const imageResponse = await uploadProfileImage();

      const imageUrl =
        imageResponse?.data?.profileImage ||
        imageResponse?.data?.profilePicture ||
        imageResponse?.data?.url ||
        formData.photo;

      const profileToSave = {
        ...formData,
        photo: imageUrl,
        phoneCode,
      };

      setFormData((prev) => ({
        ...prev,
        photo: imageUrl,
      }));
      setSavedProfile(profileToSave);
      setIsEditing(false);

      saveUserProfile({
        email: formData.email,
        role: "client",
        name: formData.fullName,
        avatarUrl: imageUrl,
      });

      dispatchAuthChanged();

      alert("Profile saved successfully!");
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
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
        skills: savedProfile.skills || [],
        servicesWanted: savedProfile.servicesWanted || [],
      });

      setPhoneCode(savedProfile.phoneCode || "+20");
    }

    setIsEditing(true);
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to clear this profile form?"
    );

    if (!confirmDelete) return;

    setFormData(emptyForm);
    setSavedProfile(null);
    setIsEditing(true);
    setPhoneCode("+20");
  };

  const handleAddPaymentMethod = async () => {
    const type = window.prompt("Type payment method: bank or paypal");

    if (!type) return;

    const normalizedType = type.trim().toLowerCase();

    try {
      let payload;

      if (normalizedType === "paypal") {
        const email = window.prompt("Enter PayPal email");
        if (!email) return;

        payload = {
          type: "paypal",
          providerData: {
            email,
          },
        };
      } else {
        const bankName = window.prompt("Enter bank name");
        if (!bankName) return;

        const accountNumber = window.prompt("Enter account number");
        if (!accountNumber) return;

        payload = {
          type: "bank",
          providerData: {
            bankName,
            accountNumber,
          },
        };
      }

      await apiRequest("/billing/payment-method", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const paymentsRes = await apiRequest("/billing/payment-methods");
      setPaymentMethods(normalizePaymentMethods(paymentsRes));
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to add payment method");
    }
  };

  const handleRemovePaymentMethod = async (method) => {
    const id = method?._id || method?.id;

    if (!id) {
      setPaymentMethods((prev) => prev.filter((item) => item !== method));
      return;
    }

    try {
      await apiRequest(`/billing/payment-method/${id}`, {
        method: "DELETE",
      });

      setPaymentMethods((prev) =>
        prev.filter((item) => (item._id || item.id) !== id)
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to remove payment method");
    }
  };

  const handleChangePassword = async () => {
    const oldPassword = window.prompt("Enter old password");
    if (!oldPassword) return;

    const password = window.prompt("Enter new password");
    if (!password) return;

    const confirmPassword = window.prompt("Confirm new password");
    if (!confirmPassword) return;

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await apiRequest("/user/update-password", {
        method: "PATCH",
        body: JSON.stringify({
          oldPassword,
          password,
          confirmPassword,
        }),
      });

      alert("Password changed successfully");
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to change password");
    }
  };

  const getPaymentIcon = (method) => {
    const lowerMethod = String(method?.type || method?.label || "").toLowerCase();

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

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#F5FAFA] px-4 py-10 mt-[72px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0B6B63]" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header profileImage={formData.photo} />

      <div className="min-h-screen bg-[#F5FAFA] px-4 sm:px-6 py-6 sm:py-10 mt-[72px]">
        <div className="w-full max-w-[980px] mx-auto bg-white rounded-[12px] border border-[#E5E7EB] p-4 sm:p-6 md:p-9">
          <h1 className="text-[18px] font-semibold text-[#111827]">
            Personal Information
          </h1>

          <p className="mt-2 text-[14px] text-[#6B7280]">
            Basic details to identify and manage your account.
          </p>

          {isEditing ? (
            <>
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-[72px] h-[72px] rounded-full bg-[#D9D9D9] overflow-hidden flex items-center justify-center shrink-0">
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
                    className="w-full h-[48px] rounded-[10px] border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B6B63]"
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
                    placeholder="hanan6686"
                    className="w-full h-[48px] rounded-[10px] border border-[#D1D5DB] px-4 text-[14px] outline-none focus:border-[#0B6B63]"
                  />
                </div>
              </div>

              <div className="mt-9 border border-[#E5E7EB] rounded-[10px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                  className="w-full min-h-[52px] bg-[#F5FAFA] px-5 flex items-center justify-between text-left text-[14px] text-black"
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
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                      <div>
                        <label className="block text-[14px] font-medium text-black mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          disabled
                          placeholder="client@example.com"
                          className="w-full h-[48px] rounded-[10px] border border-[#D1D5DB] px-4 text-[14px] outline-none bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-[14px] font-medium text-black mb-2">
                          Phone Number
                        </label>
                        <div className="flex items-center w-full h-[48px] rounded-[10px] border border-[#D1D5DB] overflow-hidden focus-within:border-[#0B6B63]">
                          <div className="px-3 sm:px-4 text-[14px] text-[#6B7280] border-r border-[#D1D5DB] bg-[#FAFAFA] h-full flex items-center shrink-0">
                            {phoneCode}
                          </div>
                          <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="12345678"
                            className="w-full h-full px-3 sm:px-4 text-[14px] outline-none"
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
                          {Object.keys(COUNTRY_CODES).map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[14px] font-medium text-black mb-2">
                          Bio
                        </label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          placeholder="Tell us about yourself"
                          rows="3"
                          className="w-full min-h-[90px] rounded-[10px] border border-[#D1D5DB] px-4 py-3 text-[14px] outline-none resize-none focus:border-[#0B6B63]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mt-8 border border-[#E5E7EB] rounded-[10px] p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-[72px] h-[72px] rounded-full bg-[#D9D9D9] overflow-hidden flex items-center justify-center shrink-0">
                  {savedProfile?.photo ? (
                    <img
                      src={savedProfile.photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                <div>
                  <h3 className="text-[20px] font-semibold text-[#111827] break-words">
                    {savedProfile?.fullName || "No Name"}
                  </h3>
                  <p className="mt-1 text-[14px] text-[#6B7280] break-words">
                    @{savedProfile?.userName || "No Username"}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-[13px] text-[#6B7280] mb-2">Email</p>
                  <p className="text-[15px] text-[#111827] break-words">
                    {savedProfile?.email || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[13px] text-[#6B7280] mb-2">
                    Phone Number
                  </p>
                  <p className="text-[15px] text-[#111827] break-words">
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

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            {isEditing ? (
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full sm:w-auto min-w-[140px] h-[48px] rounded-[10px] bg-[#0B6B63] text-white text-[16px] font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEditProfile}
                className="w-full sm:w-auto min-w-[140px] h-[48px] rounded-[10px] bg-[#0B6B63] text-white text-[16px] font-medium hover:opacity-90 transition"
              >
                Edit Profile
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              className="w-full sm:w-auto min-w-[140px] h-[48px] rounded-[10px] border border-[#FF3B30] text-[#FF3B30] text-[16px] font-medium hover:bg-red-50 transition"
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
                <p className="mt-3 text-[15px] text-[#667085]">
                  Account Type
                </p>
              </div>

              <div className="bg-[#FBFBFB] rounded-[12px] p-5 flex flex-col items-center justify-center min-h-[96px]">
                <h3 className="text-[22px] font-semibold text-[#111827]">
                  {accountDetails.totalTeamsBuilt}
                </h3>
                <p className="mt-1 text-[15px] text-[#667085]">
                  Total Teams Built
                </p>
              </div>

              <div className="bg-[#FBFBFB] rounded-[12px] p-5 flex flex-col items-center justify-center min-h-[96px]">
                <h3 className="text-[22px] font-semibold text-[#111827]">
                  {accountDetails.averageRating}
                </h3>
                <p className="mt-1 text-[15px] text-[#667085]">
                  Average Rating
                </p>
              </div>

              <div className="bg-[#FBFBFB] rounded-[12px] p-5 flex flex-col items-center justify-center min-h-[96px]">
                <div className="flex items-center gap-2 text-[#D4A017]">
                  <Crown size={18} />
                  <span className="text-[22px] font-semibold text-[#111827]">
                    {accountDetails.clientRanking}
                  </span>
                </div>
                <p className="mt-1 text-[15px] text-[#667085]">
                  Client Ranking
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[#E5E7EB]" />

          <div className="pt-8">
            <h2 className="text-[18px] font-semibold text-[#111827]">
              Payment & Billing information
            </h2>

            <div className="mt-7 space-y-5">
              {paymentMethods.length === 0 ? (
                <p className="text-[14px] text-[#667085]">
                  No payment methods yet.
                </p>
              ) : (
                paymentMethods.map((method, index) => (
                  <div
                    key={method._id || index}
                    className="min-h-[56px] rounded-[10px] border border-[#E5E7EB] px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getPaymentIcon(method)}
                      <span className="text-[16px] text-[#475467] break-words">
                        {method.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePaymentMethod(method)}
                      className="text-left sm:text-right text-[#FF3B30] text-[16px] font-medium hover:opacity-80"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleAddPaymentMethod}
              className="mt-6 w-full sm:w-auto min-w-[150px] h-[44px] px-4 rounded-[10px] border border-[#0B6B63] text-[#0B6B63] text-[15px] font-medium hover:bg-[#F5FAFA] transition"
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

                {billingHistory.length === 0 ? (
                  <div className="px-6 py-5 text-[#667085]">
                    No billing history yet.
                  </div>
                ) : (
                  billingHistory.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="grid grid-cols-5 bg-white text-[15px] border-b last:border-b-0 border-[#E5E7EB] items-center"
                    >
                      <div className="px-6 py-5 text-[#0B6B63]">
                        {item.projectName}
                      </div>

                      <div className="px-6 py-5">
                        <span
                          className={`inline-flex items-center justify-center px-4 h-[28px] rounded-full text-[13px] font-medium ${
                            item.status === "Completed" ||
                            item.status === "completed"
                              ? "bg-[#DDF6E7] text-[#32A071]"
                              : "bg-[#DCE8FF] text-[#4A7CFF]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="px-6 py-5 text-[#111827]">
                        {item.teamSize}
                      </div>

                      <div className="px-6 py-5">
                        {item.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: Math.min(item.rating, 5) },
                              (_, i) => i + 1
                            ).map((star) => (
                              <Star
                                key={star}
                                size={20}
                                className="fill-[#F4C518] text-[#F4C518]"
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#98A2B3] text-[22px]">
                            —
                          </span>
                        )}
                      </div>

                      <div className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => navigate(`/client/job/${item.id}`)}
                          className="text-[#0B6B63] text-[15px] font-medium hover:opacity-80"
                        >
                          {item.action}
                        </button>
                      </div>
                    </div>
                  ))
                )}
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

            <div className="mt-10 flex flex-col items-center text-center">
              <h3 className="text-[44px] sm:text-[56px] leading-none font-semibold text-[#111827]">
                {feedbackRates.overallScore}
              </h3>

              <div className="mt-6">{renderStars(Math.round(feedbackRates.overallScore), 24)}</div>

              <p className="mt-5 text-[18px] text-[#475467]">
                Overall Client Score
              </p>
            </div>

            <div className="mt-12 max-w-[860px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-y-7">
              <div className="text-[16px] sm:text-[18px] text-[#667085]">
                Communication
              </div>
              <div className="md:justify-self-end">
                {renderStars(feedbackRates.communication, 22)}
              </div>

              <div className="text-[16px] sm:text-[18px] text-[#667085]">
                Timely Payments
              </div>
              <div className="md:justify-self-end">
                {renderStars(feedbackRates.timelyPayments, 22)}
              </div>

              <div className="text-[16px] sm:text-[18px] text-[#667085]">
                Clarity of Requirements
              </div>
              <div className="md:justify-self-end">
                {renderStars(feedbackRates.clarityOfRequirements, 22)}
              </div>

              <div className="text-[16px] sm:text-[18px] text-[#667085]">
                Professionalism
              </div>
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

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate("/client/my-jobs")}
                className="w-full sm:w-auto px-6 h-[44px] rounded-[10px] border border-[#0B6B63] text-[#0B6B63] text-[15px] font-medium hover:bg-[#F5FAFA] transition"
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

            <div className="mt-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[18px] text-[#111827]">Change Password</p>

              <button
                type="button"
                onClick={handleChangePassword}
                className="text-left sm:text-right text-[#0B6B63] text-[18px] font-medium hover:opacity-80"
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