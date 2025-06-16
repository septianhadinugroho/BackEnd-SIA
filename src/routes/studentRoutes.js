const studentController = require('../controllers/studentController');

const studentRoutes = [
  {
    method: 'GET',
    path: '/student/profile',
    handler: studentController.getProfile,
    options: { auth: { strategy: 'jwt', scope: ['student'] } }
  },
  {
    method: 'PUT',
    path: '/student/profile',
    handler: studentController.updateProfile,
    options: { auth: { strategy: 'jwt', scope: ['student'] } }
  },
  {
    method: 'GET',
    path: '/student/krs-khs',
    handler: studentController.getKrsKhs,
    options: { auth: { strategy: 'jwt', scope: ['student'] } }
  },
  {
    method: 'GET',
    path: '/student/finance',
    handler: studentController.getFinance,
    options: { auth: { strategy: 'jwt', scope: ['student'] } }
  },
  {
    method: 'GET',
    path: '/student/notifications',
    handler: studentController.getNotifications,
    options: { auth: { strategy: 'jwt', scope: ['student'] } }
  },
  {
    method: 'POST',
    path: '/student/requests',
    handler: studentController.submitRequest,
    options: { auth: { strategy: 'jwt', scope: ['student'] } }
  }
];

module.exports = studentRoutes;