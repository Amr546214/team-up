/**
 * Mock user data store
 * In production, replace this with actual database queries (MongoDB, PostgreSQL, etc.)
 */

// Sample users for testing
const users = [
  {
    _id: '507f1f77bcf86cd799439011',
    email: 'client@test.com',
    password: '$2a$10$hashed_password_here', // bcrypt hashed
    role: 'client',
    fullName: 'Test Client',
    companyName: null,
    companySize: null,
    industry: null,
    skills: [],
    servicesWanted: ['Web Development', 'Mobile App'],
    createdAt: '2024-01-15T10:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439012',
    email: 'developer@test.com',
    password: '$2a$10$hashed_password_here',
    role: 'developer',
    fullName: 'Test Developer',
    companyName: null,
    companySize: null,
    industry: null,
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
    servicesWanted: [],
    createdAt: '2024-01-15T11:00:00.000Z'
  },
  {
    _id: '507f1f77bcf86cd799439013',
    email: 'company@test.com',
    password: '$2a$10$hashed_password_here',
    role: 'company',
    fullName: null,
    companyName: 'Tech Solutions Inc',
    companySize: '50-200',
    industry: 'Technology',
    skills: [],
    servicesWanted: [],
    createdAt: '2024-01-15T12:00:00.000Z'
  }
];

/**
 * Find user by ID
 * @param {string} userId - User ID from JWT token
 * @returns {object|null} User object or null if not found
 */
const findUserById = (userId) => {
  return users.find(user => user._id === userId) || null;
};

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {object|null} User object or null if not found
 */
const findUserByEmail = (email) => {
  return users.find(user => user.email === email) || null;
};

module.exports = {
  findUserById,
  findUserByEmail,
  users
};
