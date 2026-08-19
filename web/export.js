// ── EXPORTACIONES ──
const ExportManager = {
  exportPNG(elementId, filename) {
    const el = document.getElementById(elementId) || document.getElementById('dashboardGrid');
    if (!el) { showToast('No se encontró el contenido a exportar', 'warning'); return; }

    if (typeof html2canvas === 'undefined') {
      showToast('html2canvas no disponible', 'error');
      return;
    }

    showToast('Generando imagen...', 'info');
    html2canvas(el, {
      backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#0f172a' : '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = filename || `voto-real-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Imagen PNG exportada', 'success');
      ActivityLog.add('Exportación PNG', filename || 'Dashboard');
    }).catch(err => {
      console.error('html2canvas error:', err);
      showToast('Error al generar PNG', 'error');
    });
  },

  exportCSV() {
    const filter = getFilterContext();
    const totals = lideres(filter);
    const grand = totalVotos(totals);
    const rows = [
      ['Partido', 'Votos', 'Porcentaje', 'Nivel'],
      ...PARTY_KEYS.map(k => [
        PARTIES[k].label,
        totals[k],
        grand > 0 ? ((totals[k] / grand) * 100).toFixed(2) + '%' : '0.00%',
        LocationFilters.getLevelLabel()
      ])
    ];
    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\r\n');
    this._download('\uFEFF' + csv, `resultados-${Date.now()}.csv`, 'text/csv;charset=utf-8');
    showToast('CSV exportado correctamente', 'success');
    ActivityLog.add('Exportación CSV', 'Resultados electorales');
  },

  exportExcel() {
    const filter = getFilterContext();
    const totals = lideres(filter);
    const grand = totalVotos(totals);
    const now = new Date().toLocaleString('es-PE');

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">`;
    html += `<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>`;
    html += `<x:Name>Resultados</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>`;
    html += `</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>`;
    html += `<table border="1" style="border-collapse:collapse">`;
    html += `<tr style="background:#1565c0;color:#fff"><th colspan="3">Voto Real – Resultados Electorales · ${now}</th></tr>`;
    html += `<tr style="background:#e8f0fe"><th>Partido</th><th>Votos</th><th>Porcentaje</th></tr>`;
    PARTY_KEYS.forEach(k => {
      const pct = grand > 0 ? ((totals[k] / grand) * 100).toFixed(2) : '0.00';
      html += `<tr><td>${PARTIES[k].label}</td><td align="right">${totals[k].toLocaleString()}</td><td align="right">${pct}%</td></tr>`;
    });
    html += `<tr><td><b>TOTAL</b></td><td align="right"><b>${grand.toLocaleString()}</b></td><td align="right"><b>100%</b></td></tr>`;
    html += `</table></body></html>`;

    this._download('\uFEFF' + html, `resultados-${Date.now()}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    showToast('Excel exportado correctamente', 'success');
    ActivityLog.add('Exportación Excel', 'Resultados electorales');
  },

  exportPDF() {
    const content = this._buildPDFContent();
    const win = window.open('', '_blank');
    if (!win) { showToast('Permita ventanas emergentes para exportar PDF', 'warning'); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Voto Real - Reporte</title>
      <meta charset="UTF-8">
      <style>
        body{font-family:Segoe UI,Arial,sans-serif;padding:32px;color:#1e293b;max-width:900px;margin:0 auto}
        h1{color:#1565c0;border-bottom:2px solid #1565c0;padding-bottom:8px;margin-bottom:16px}
        .meta{color:#64748b;font-size:13px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
        th{background:#1565c0;color:#fff;padding:10px 12px;text-align:left}
        td{padding:9px 12px;border-bottom:1px solid #e2e8f0}
        tr:nth-child(even) td{background:#f8fafc}
        .footer{margin-top:32px;color:#94a3b8;font-size:11px;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px}
        @media print{body{padding:16px}.footer{position:fixed;bottom:0;left:0;right:0}}
      </style></head><body>${content}
      <script>window.onload=function(){window.print()}<\/script></body></html>`);
    win.document.close();
    showToast('PDF listo para imprimir', 'success');
    ActivityLog.add('Exportación PDF', 'Reporte electoral');
  },

  _buildPDFContent() {
    const filter = getFilterContext();
    const totals = lideres(filter);
    const grand = totalVotos(totals);
    const leader = getLeader(totals);
    const now = new Date().toLocaleString('es-PE');

    return `<h1>Voto Real – Reporte Electoral</h1>
      <div class="meta">
        <strong>Fecha:</strong> ${now} &nbsp;|&nbsp;
        <strong>Nivel:</strong> ${LocationFilters.getLevelLabel()} &nbsp;|&nbsp;
        <strong>Total votos:</strong> ${grand.toLocaleString()} &nbsp;|&nbsp;
        <strong>Líder:</strong> ${PARTIES[leader]?.label || leader} (${getPct(totals, leader)}%)
      </div>
      <table>
        <thead><tr><th>Partido</th><th>Votos</th><th>Porcentaje</th></tr></thead>
        <tbody>
          ${PARTY_KEYS.map(k => `<tr><td>${PARTIES[k].label}</td><td>${totals[k].toLocaleString()}</td><td>${getPct(totals, k)}%</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">Generado por Voto Real – Sistema de Conteo Electoral · ${now}</div>`;
  },

  _download(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
