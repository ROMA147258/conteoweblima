import writeXlsxFile from 'write-excel-file/browser';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export const exportUtils = {
  async exportExcel(data, fileName = 'resultados_votoreal.xlsx') {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const schema = keys.map(key => ({
      column: key,
      type: String,
      value: row => (row[key] !== undefined && row[key] !== null ? String(row[key]) : '')
    }));

    await writeXlsxFile(data, {
      schema,
      fileName
    });
  },

  exportCSV(data, fileName = 'resultados_votoreal.csv') {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const header = keys.map(k => `"${String(k).replace(/"/g, '""')}"`).join(',');
    const rows = data.map(row =>
      keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const csvContent = '\uFEFF' + header + '\n' + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  },

  exportPDF(title, columns, rows, fileName = 'reporte_votoreal.pdf') {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 22);

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [21, 101, 192] }
    });

    doc.save(fileName);
  },

  async exportPNG(elementId, fileName = 'captura_votoreal.png') {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2 });
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error al exportar PNG:', err);
    }
  }
};
