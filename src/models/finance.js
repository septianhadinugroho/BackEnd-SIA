// Define financial records schema
const financeSchema = {
  id: 'uuid',
  user_id: 'uuid',
  amount: 'decimal',
  status: ['pending', 'paid', 'overdue'],
  due_date: 'date'
};

module.exports = { financeSchema };