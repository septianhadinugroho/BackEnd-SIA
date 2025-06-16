const supabase = require('../config/supabase');

const getDashboard = async (request, h) => {
  const { data: academic, error: academicError } = await supabase
    .from('academic_records')
    .select('semester, khs');

  const { data: finance, error: financeError } = await supabase
    .from('financial_records')
    .select('status, amount');

  if (academicError || financeError) {
    return h.response({ message: 'Error fetching dashboard data' }).code(500);
  }

  // Process data for dashboard metrics
  const metrics = {
    totalStudents: academic.length,
    averageGPA: academic.reduce((sum, rec) => sum + (rec.khs?.gpa || 0), 0) / academic.length,
    pendingPayments: finance.filter(f => f.status === 'pending').length
  };

  return h.response(metrics);
};

const getReports = async (request, h) => {
  const { table, filters } = request.query;

  let query = supabase.from(table).select('*');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;

  if (error) {
    return h.response({ message: 'Error fetching reports' }).code(500);
  }

  return h.response(data);
};

module.exports = { getDashboard, getReports };