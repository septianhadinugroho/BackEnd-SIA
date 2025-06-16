const supabase = require('../config/supabase');

const getProfile = async (request, h) => {
  const { userId } = request.auth.credentials;

  const { data, error } = await supabase
    .from('users')
    .select('profile')
    .eq('id', userId)
    .single();

  if (error) {
    return h.response({ message: 'Error fetching profile' }).code(500);
  }

  return h.response(data.profile);
};

const updateProfile = async (request, h) => {
  const { userId } = request.auth.credentials;
  const { name, phone, address } = request.payload;

  const { data, error } = await supabase
    .from('users')
    .update({ profile: { name, phone, address } })
    .eq('id', userId)
    .select('profile')
    .single();

  if (error) {
    return h.response({ message: 'Error updating profile' }).code(500);
  }

  return h.response(data.profile);
};

const getKrsKhs = async (request, h) => {
  const { userId } = request.auth.credentials;

  const { data, error } = await supabase
    .from('academic_records')
    .select('semester, krs, khs')
    .eq('user_id', userId);

  if (error) {
    return h.response({ message: 'Error fetching academic records' }).code(500);
  }

  return h.response(data);
};

const getFinance = async (request, h) => {
  const { userId } = request.auth.credentials;

  const { data, error } = await supabase
    .from('financial_records')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return h.response({ message: 'Error fetching financial records' }).code(500);
  }

  return h.response(data);
};

const getNotifications = async (request, h) => {
  const { userId } = request.auth.credentials;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return h.response({ message: 'Error fetching notifications' }).code(500);
  }

  return h.response(data);
};

const submitRequest = async (request, h) => {
  const { userId } = request.auth.credentials;
  const { type, details } = request.payload;

  const { data, error } = await supabase
    .from('requests')
    .insert({ user_id: userId, type, details, status: 'pending' })
    .select()
    .single();

  if (error) {
    return h.response({ message: 'Error submitting request' }).code(500);
  }

  return h.response(data);
};

module.exports = {
  getProfile,
  updateProfile,
  getKrsKhs,
  getFinance,
  getNotifications,
  submitRequest
};