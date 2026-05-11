const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getCurrentUser } = require('../controllers/authController');

/**
 * @route   GET /auth/me
 * @desc    Get current logged-in user profile
 * @access  Private
 *
 * Headers Required:
 *   Authorization: Bearer <access_token>
 *
 * Success Response (200):
 *   {
 *     "success": true,
 *     "data": {
 *       "user": {
 *         "_id": "...",
 *         "email": "user@gmail.com",
 *         "role": "client | developer | company | admin",
 *         "fullName": "...",           // for client/developer
 *         "companyName": "...",        // for company
 *         "companySize": "...",        // for company
 *         "industry": "...",           // for company
 *         "skills": [],                // for developer
 *         "servicesWanted": [],        // for client
 *         "createdAt": "..."
 *       }
 *     }
 *   }
 *
 * Error Responses:
 *   401 - Missing/Invalid token
 *   404 - User not found
 *   500 - Server error
 */
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
