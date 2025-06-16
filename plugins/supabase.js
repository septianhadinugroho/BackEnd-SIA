const supabase = require('../config/supabase');

module.exports = {
  name: 'supabase',
  version: '1.0.0',
  register: async (server) => {
    // Dekorasi server dan request dengan instance supabase
    server.decorate('server', 'supabase', supabase);
    server.decorate('request', 'supabase', supabase);
  },
};