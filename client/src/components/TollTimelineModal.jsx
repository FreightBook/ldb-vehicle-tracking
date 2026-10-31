import React from 'react';
import { X, Truck, FileDown, ArrowUp } from 'lucide-react';
import { exportTruckReportToPdf } from '../utils/pdfExport';

/**
 * Format event time into DD-MM-YYYY HH:mm:ss IST
 */
function formatISTTime(timeStr) {
  if (!timeStr) return 'N/A';
  const parts = timeStr.trim().split(' ');
  if (parts.length >= 2) {
    const dateParts = parts[0].split('-');
    const timePart = parts[1].split('.')[0];
    if (dateParts.length === 3) {
      return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart}  IST`;
    }
  }
  return `${timeStr} IST`;
}

/**
 * Extract date part DD-MM-YYYY
 */
function extractDateOnly(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.trim().split(' ');
  const dateParts = parts[0].split('-');
  if (dateParts.length === 3) {
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  }
  return parts[0];
}

export default function TollTimelineModal({ isOpen, onClose, trip, events = [] }) {
  if (!isOpen || !trip) return null;

  // Chronological order: oldest at bottom, newest at top!
  // So sorted ascending by timestamp: index 0 is oldest (bottom), index (length - 1) is newest (top)
  const sortedAsc = [...events].sort(
    (a, b) => new Date(a.eventTimestamp) - new Date(b.eventTimestamp)
  );

  // When rendering in standard column, top item in HTML is top on screen.
  // So we reverse it for display: index 0 is the NEWEST (top of screen with red marker)
  // and the last item in array is the OLDEST (bottom of screen)
  const displayEvents = [...sortedAsc].reverse();

  const handleDownloadPdf = () => {
    exportTruckReportToPdf(trip, events);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-[#132238] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-wide">
                  {trip.vehicleNumber}
                </h2>
                <span
                  className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    trip.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}
                >
                  {trip.status}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-300">
                Timeline ({events.length} Tolls Recorded)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow transition"
              title="Download PDF Report"
            >
              <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 md:p-10 relative bg-[#f4f6f9]">
          {displayEvents.length === 0 ? (
            <div className="py-20 text-center">
              <Truck className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600">
                No toll crossing events recorded yet for this trip.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                The 60-second crawler will automatically record toll plazas as the truck progresses.
              </p>
            </div>
          ) : (
            <div className="relative max-w-3xl min-w-[480px] sm:min-w-0 mx-auto py-8">
              {/* Central Yellow Road */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-2.5 bg-[#f59e0b] rounded-full shadow-inner">
                {/* Upward Blue Direction Arrow at top */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-blue-600 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[14px] border-b-blue-600"></div>
                </div>
              </div>

              {/* Event Cards along the road */}
              <div className="space-y-12 relative">
                {displayEvents.map((ev, index) => {
                  const isLatest = index === 0;
                  // Alternate: even index on left, odd index on right (or matching image style)
                  const isLeft = index % 2 === 0;
                  const dateStr = extractDateOnly(ev.eventTime);
                  const formattedIST = formatISTTime(ev.eventTime);

                  return (
                    <div
                      key={ev._id || index}
                      className="relative flex items-center justify-between w-full"
                    >
                      {/* Left Side Slot */}
                      <div className="w-[45%] flex justify-end">
                        {isLeft ? (
                          <div className="w-full max-w-sm rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white transform hover:-translate-y-0.5 transition duration-150">
                            {/* Blue Header Banner with Right Chevron Pointer */}
                            <div className="bg-[#0d5f96] text-white px-4 py-2 font-semibold text-xs tracking-wide uppercase chevron-banner-right pr-6">
                              {ev.locName}
                            </div>
                            {/* Card Body */}
                            <div className="p-3 flex items-center justify-between text-xs bg-white">
                              <div className="flex items-center gap-2 text-sky-700">
                                <Truck className="w-4 h-4 fill-sky-600 stroke-none" />
                                <span className="font-bold text-[11px] text-[#0d5f96]">
                                  {ev.eventName || 'TOLL PLAZA CROSSED'}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-red-600 whitespace-nowrap">
                                {formattedIST}
                              </span>
                            </div>
                          </div>
                        ) : (
                          // Date label next to node for right cards
                          <div className="text-right pr-4">
                            <span className="text-xs font-bold text-sky-700">
                              {dateStr}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Center Node Marker on Yellow Line */}
                      <div className="relative z-10 flex items-center justify-center">
                        {isLatest ? (
                          // Latest toll has a pulsing Red Marker
                          <div className="relative flex items-center justify-center">
                            <div className="absolute w-7 h-7 rounded-full bg-red-400/40 animate-ping"></div>
                            <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          </div>
                        ) : (
                          // Earlier tolls have blue ring marker matching image
                          <div className="w-4.5 h-4.5 rounded-full bg-white border-[3px] border-[#0d5f96] shadow-sm"></div>
                        )}
                      </div>

                      {/* Right Side Slot */}
                      <div className="w-[45%] flex justify-start">
                        {!isLeft ? (
                          <div className="w-full max-w-sm rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white transform hover:-translate-y-0.5 transition duration-150">
                            {/* Blue Header Banner with Left Chevron Pointer */}
                            <div className="bg-[#0d5f96] text-white px-4 py-2 font-semibold text-xs tracking-wide uppercase chevron-banner-left pl-6">
                              {ev.locName}
                            </div>
                            {/* Card Body */}
                            <div className="p-3 flex items-center justify-between text-xs bg-white">
                              <div className="flex items-center gap-2 text-sky-700">
                                <Truck className="w-4 h-4 fill-sky-600 stroke-none" />
                                <span className="font-bold text-[11px] text-[#0d5f96]">
                                  {ev.eventName || 'TOLL PLAZA CROSSED'}
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-red-600 whitespace-nowrap">
                                {formattedIST}
                              </span>
                            </div>
                          </div>
                        ) : (
                          // Date label next to node for left cards
                          <div className="text-left pl-4">
                            <span className="text-xs font-bold text-sky-700">
                              {dateStr}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

