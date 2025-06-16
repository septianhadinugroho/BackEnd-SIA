const bcrypt = require('bcrypt');
const Jwt = require('jsonwebtoken');

module.exports = [
  {
    method: 'POST',
    path: '/login',
    handler: async (request, h) => {
      const { email, password } = request.payload;
      if (!email || !password) {
        return h.response({ message: 'Email and password are required' }).code(400);
      }

      try {
        const { data: user, error } = await request.server.app.supabase
          .from('users')
          .select('id, email, password, role, profile')
          .eq('email', email)
          .single();
        if (error || !user) {
          return h.response({ message: 'Invalid email or password' }).code(401);
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return h.response({ message: 'Invalid email or password' }).code(401);
        }

        const token = Jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return h.response({
          message: 'Login successful',
          token,
          user: { id: user.id, email: user.email, role: user.role, profile: user.profile }
        }).code(200);
      } catch (err) {
        return h.response({ message: 'Internal server error' }).code(500);
      }
    }
  },
  {
    method: 'POST',
    path: '/register',
    handler: async (request, h) => {
      const { email, password, role, profile } = request.payload;
      if (!email || !password || !role || !profile) {
        return h.response({ message: 'Email, password, role, and profile are required' }).code(400);
      }

      try {
        const { data: existingUser } = await request.server.app.supabase
          .from('users')
          .select('email')
          .eq('email', email)
          .single();
        if (existingUser) {
          return h.response({ message: 'Email already exists' }).code(409);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: user, error } = await request.server.app.supabase
          .from('users')
          .insert([{ email, password: hashedPassword, role, profile }])
          .select('id, email, role, profile')
          .single();
        if (error) throw error;

        return h.response({ message: 'User registered successfully', user }).code(201);
      } catch (err) {
        return h.response({ message: `Error registering user: ${err.message}` }).code(500);
      }
    }
  }
];