import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format timestamp "2026-10-31 04:30:54.000" to "31-10-2026 04:30:54"
 */
function formatEventTime(timeStr) {
  if (!timeStr) return 'N/A';
  const clean = String(timeStr).trim();
  const parts = clean.split(/[ T]/);
  if (parts.length >= 2) {
    const dateParts = parts[0].split('-');
    const timePart = parts[1].split('.')[0];
    if (dateParts.length === 3) {
      return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart}`;
    }
  }
  return clean;
}

/**
 * Generates and downloads PDF report matching Image 3
 */
export function exportTruckReportToPdf(trip, events = []) {
  if (!trip) {
    console.warn('Cannot export PDF: No trip provided');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // 1. Page number in top right (Image 3)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('1', pageWidth - 45, 35, { align: 'right' });

  // 2. Title (Image 3)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Truck Tracking Report', pageWidth / 2, 50, { align: 'center' });

  // 3. Horizontal line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(margin, 70, pageWidth - margin, 70);

  // 4. Gray Box for Truck Information (Image 3)
  const boxY = 85;
  const boxHeight = 44;
  doc.setFillColor(200, 200, 200); // light gray
  doc.rect(margin, boxY, contentWidth, boxHeight, 'FD'); // Fill and Draw border

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Truck Number :  ${trip.vehicleNumber}`, margin + 15, boxY + 26);
  doc.text(
    `Container Number :  ${events[0]?.containerNumber || 'N/A'}`,
    pageWidth / 2 + 10,
    boxY + 26
  );

  // 5. Section Header (Image 3)
  const sectionY = 160;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Truck Events Details', pageWidth / 2, sectionY, { align: 'center' });

  // 6. Table (Image 3)
  // Sort descending: S.No 1 is latest toll
  const sorted = [...events].sort(
    (a, b) => new Date(b.eventTimestamp || b.createdAt) - new Date(a.eventTimestamp || a.createdAt)
  );

  const tableRows = sorted.map((ev, index) => [
    index + 1,
    ev.eventName || 'TOLL PLAZA CROSSED',
    ev.locName || 'N/A',
    formatEventTime(ev.eventTime),
  ]);

  if (tableRows.length === 0) {
    tableRows.push(['-', 'No toll records found', 'N/A', 'N/A']);
  }

  autoTable(doc, {
    startY: sectionY + 20,
    margin: { left: margin, right: margin },
    head: [['S.No.', 'Event Name', 'Location', 'Event Time']],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.8,
      cellPadding: 6,
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 50, halign: 'center' },
      1: { cellWidth: 140, halign: 'left' },
      2: { cellWidth: 185, halign: 'left' },
      3: { cellWidth: 'auto', halign: 'left' },
    },
  });

  doc.save(`Truck_Report_${trip.vehicleNumber}.pdf`);
}
