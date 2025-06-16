const ExcelJS = require('exceljs');

module.exports = {
  exportToExcel: async (data, headers, filename) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    worksheet.columns = headers;
    data.forEach(row => worksheet.addRow(row));

    return workbook.xlsx.writeBuffer();
  },
};