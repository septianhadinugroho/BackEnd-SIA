// Define academic records schema
const academicSchema = {
  id: 'uuid',
  user_id: 'uuid',
  semester: 'integer',
  krs: 'jsonb',
  khs: 'jsonb'
};

module.exports = { academicSchema };