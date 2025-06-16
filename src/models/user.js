// Define user model schema (used for validation)
const userSchema = {
  id: 'uuid',
  email: 'string',
  password: 'string',
  role: ['student', 'admin', 'policymaker'],
  profile: {
    name: 'string',
    phone: 'string?',
    address: 'string?'
  }
};

// Note: Supabase handles actual schema enforcement
module.exports = { userSchema };