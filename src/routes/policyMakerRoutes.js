const policyMakerController = require('../controllers/policyMakerController');

const policyMakerRoutes = [
  {
    method: 'GET',
    path: '/policymaker/dashboard',
    handler: policyMakerController.getDashboard,
    options: { auth: { strategy: 'jwt', scope: ['policymaker'] } }
  },
  {
    method: 'GET',
    path: '/policymaker/reports',
    handler: policyMakerController.getReports,
    options: { auth: { strategy: 'jwt', scope: ['policymaker'] } }
  }
];

module.exports = policyMakerRoutes;