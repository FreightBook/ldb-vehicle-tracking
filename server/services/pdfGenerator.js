const PDFDocument = require('pdfkit');

/**
 * Format timestamp into DD-MM-YYYY HH:mm:ss
 */
function formatEventTime(timeStr) {
  if (!timeStr) return 'N/A';
  // "2026-10-31 04:30:54.000" -> "31-10-2026 04:30:54"
  const parts = timeStr.trim().split(' ');
  if (parts.length >= 2) {
    const dateParts = parts[0].split('-');
    const timePart = parts[1].split('.')[0];
    if (dateParts.length === 3) {
      return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart}`;
    }
  }
  return timeStr;
}

/**
 * Generates Truck Tracking Report PDF matching Image 3 specification
 * @param {Object} trip - Trip document
 * @param {Array} events - Array of TollEvent documents
 * @param {Stream} stream - Output writable stream
 */
function generateTruckReportPDF(trip, events, stream) {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
  });

  doc.pipe(stream);

  const pageWidth = doc.page.width; // 595.28 for A4
  const startX = 40;
  const contentWidth = pageWidth - 80; // 515.28

  // 1. Top Page Number (Top right)
  doc.fontSize(10).font('Helvetica').text('1', pageWidth - 50, 35, { align: 'right' });

  // 2. Report Title
  doc.fontSize(16).font('Helvetica-Bold').text('Truck Tracking Report', startX, 48, {
    align: 'center',
    width: contentWidth,
  });

  // 3. Horizontal line
  doc
    .strokeColor('#000000')
    .lineWidth(1)
    .moveTo(startX, 75)
    .lineTo(startX + contentWidth, 75)
    .stroke();

  // 4. Truck Info Gray Box
  const boxY = 90;
  const boxHeight = 46;

  doc
    .rect(startX, boxY, contentWidth, boxHeight)
    .fillAndStroke('#c8c8c8', '#000000');

  // Text inside box
  doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
  doc.text(`Truck Number :  ${trip.vehicleNumber}`, startX + 16, boxY + 16);
  doc.text(
    `Container Number :  ${events[0]?.containerNumber || 'N/A'}`,
    startX + contentWidth / 2 + 10,
    boxY + 16
  );

  // 5. Section Header
  const sectionY = 160;
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Truck Events Details', startX, sectionY, {
    align: 'center',
    width: contentWidth,
  });

  // 6. Data Table
  const tableY = sectionY + 30;
  const colWidths = {
    sno: 50,
    eventName: 140,
    location: 190,
    eventTime: contentWidth - (50 + 140 + 190), // ~135
  };

  const xSno = startX;
  const xEvent = xSno + colWidths.sno;
  const xLoc = xEvent + colWidths.eventName;
  const xTime = xLoc + colWidths.location;

  const rowHeight = 26;

  // Header Row
  doc.rect(startX, tableY, contentWidth, rowHeight).fillAndStroke('#c8c8c8', '#000000');
  doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold');

  doc.text('S.No.', xSno, tableY + 8, { width: colWidths.sno, align: 'center' });
  doc.text('Event Name', xEvent, tableY + 8, {
    width: colWidths.eventName,
    align: 'center',
  });
  doc.text('Location', xLoc, tableY + 8, { width: colWidths.location, align: 'center' });
  doc.text('Event Time', xTime, tableY + 8, {
    width: colWidths.eventTime,
    align: 'center',
  });

  // Table Data Rows
  let currentY = tableY + rowHeight;
  doc.font('Helvetica').fontSize(9);

  // Display events (most recent first, or sorted as per image: S.No 1 is latest)
  // Let's sort descending so 1 is latest toll
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.eventTimestamp) - new Date(a.eventTimestamp)
  );

  if (sortedEvents.length === 0) {
    doc.rect(startX, currentY, contentWidth, rowHeight).fillAndStroke('#ffffff', '#000000');
    doc.fillColor('#666666').text('No toll crossing events recorded yet', startX, currentY + 8, {
      width: contentWidth,
      align: 'center',
    });
    currentY += rowHeight;
  } else {
    sortedEvents.forEach((ev, idx) => {
      // Check page overflow
      if (currentY + rowHeight > doc.page.height - 40) {
        doc.addPage();
        currentY = 40;
      }

      // Row border and fill
      doc
        .rect(startX, currentY, contentWidth, rowHeight)
        .fillAndStroke('#ffffff', '#000000');

      // Vertical column dividers
      doc.moveTo(xEvent, currentY).lineTo(xEvent, currentY + rowHeight).stroke();
      doc.moveTo(xLoc, currentY).lineTo(xLoc, currentY + rowHeight).stroke();
      doc.moveTo(xTime, currentY).lineTo(xTime, currentY + rowHeight).stroke();

      // Text cells
      doc.fillColor('#000000');
      doc.text(String(idx + 1), xSno, currentY + 8, {
        width: colWidths.sno,
        align: 'center',
      });
      doc.text(ev.eventName || 'TOLL PLAZA CROSSED', xEvent + 6, currentY + 8, {
        width: colWidths.eventName - 12,
        align: 'left',
      });
      doc.text(ev.locName || 'N/A', xLoc + 6, currentY + 8, {
        width: colWidths.location - 12,
        align: 'left',
      });
      doc.text(formatEventTime(ev.eventTime), xTime + 6, currentY + 8, {
        width: colWidths.eventTime - 12,
        align: 'left',
      });

      currentY += rowHeight;
    });
  }

  doc.end();
}

module.exports = {
  generateTruckReportPDF,
  formatEventTime,
};

