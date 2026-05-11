const { findUserById } = require('../data/userStore');

/**
 * @desc    Get current logged-in user
 * @route   GET /auth/me
 * @access  Private (requires valid Bearer token)
 *
 * Returns the authenticated user's profile data without sensitive fields.
 * Requires Authorization header with Bearer token.
 */
const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by the verifyToken middleware
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }

    // Find user by ID (replace with actual DB query in production)
    const user = findUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build response based on role (exclude password and other sensitive fields)
    const responseData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    // Add role-specific fields
    if (user.role === 'client') {
      responseData.fullName = user.fullName;
      responseData.servicesWanted = user.servicesWanted || [];
    } else if (user.role === 'developer') {
      responseData.fullName = user.fullName;
      responseData.skills = user.skills || [];
    } else if (user.role === 'company') {
      responseData.companyName = user.companyName;
      responseData.companySize = user.companySize;
      responseData.industry = user.industry;
    }

    console.log(`GET /auth/me - User ${user.email} (${user.role}) retrieved successfully`);

    return res.status(200).json({
      success: true,
      data: {
        user: responseData
      }
    });

  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getCurrentUser
};
