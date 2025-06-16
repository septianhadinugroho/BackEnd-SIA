const adminController = require('../controllers/adminController');

const adminRoutes = [
  {
    method: 'GET',
    path: '/admin/dashboard',
    handler: async (request, h) => {
      try {
        const { credentials } = request.auth;
        if (!credentials.scope.includes('admin')) {
          return h.response({ message: 'Admin access required' }).code(403);
        }
        const { count: totalUsers } = await request.server.app.supabase
          .from('users')
          .select('*', { count: 'exact' });
        const { count: students } = await request.server.app.supabase
          .from('users')
          .select('*', { count: 'exact' })
          .eq('role', 'student');
        const { count: admins } = await request.server.app.supabase
          .from('users')
          .select('*', { count: 'exact' })
          .eq('role', 'admin');
        const { count: policymakers } = await request.server.app.supabase
          .from('users')
          .select('*', { count: 'exact' })
          .eq('role', 'policymaker');
        return h.response({
          data: { totalUsers, students, admins, policymakers }
        }).code(200);
      } catch (err) {
        return h.response({ message: `Error fetching dashboard data: ${err.message}` }).code(500);
      }
    },
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      }
    }
  },
  {
    method: 'GET',
    path: '/admin/users',
    handler: async (request, h) => {
      try {
        const { data, error } = await request.server.app.supabase
          .from('users')
          .select('id, email, role, profile');
        if (error) throw error;
        return h.response({ users: data }).code(200);
      } catch (err) {
        return h.response({ message: `Error fetching users: ${err.message}` }).code(500);
      }
    },
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      }
    }
  },
  {
    method: ['POST', 'PUT', 'DELETE'],
    path: '/admin/users',
    handler: adminController.crudUser,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      }
    }
  },
  {
    method: 'POST',
    path: '/admin/academic',
    handler: adminController.manageAcademic,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      }
    }
  },
  {
    method: 'POST',
    path: '/admin/finance',
    handler: adminController.manageFinance,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      }
    }
  },
  {
    method: 'GET',
    path: '/admin/export',
    handler: adminController.exportData,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      }
    }
  },
  {
    method: 'PUT',
    path: '/admin/access',
    handler: adminController.manageAccess,
    options: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      }
    }
  }
];

module.exports = adminRoutes;