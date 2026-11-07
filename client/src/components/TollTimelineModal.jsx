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
      return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${timePart} IST`;
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

export default function TollTimelineModal({
  isOpen,
  onClose,
  trip,
  events = [],
  pollInterval = 1800,
}) {
  if (!isOpen || !trip) return null;

  // Chronological order: newest at top (displayEvents[0])
  const sortedAsc = [...events].sort(
    (a, b) => new Date(a.eventTimestamp) - new Date(b.eventTimestamp)
  );
  const displayEvents = [...sortedAsc].reverse();

  const handleDownloadPdf = () => {
    exportTruckReportToPdf(trip, events);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-y-auto">
      <div className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92dvh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-[#132238] px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Truck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-wide truncate">
                  {trip.vehicleNumber}
                </h2>
                <span
                  className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    trip.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}
                >
                  {trip.status}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-300 truncate">
                {trip.origin || trip.destination ? (
                  <span className="text-sky-300 font-medium">
                    {trip.origin || 'N/A'} ➔ {trip.destination || 'N/A'}
                    {trip.estimatedDistanceKm ? ` (~${trip.estimatedDistanceKm} km)` : ''} •{' '}
                  </span>
                ) : null}
                Toll Timeline ({events.length} Recorded)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow transition"
              title="Download PDF Report"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-10 relative bg-[#f4f6f9] overscroll-contain">
          {displayEvents.length === 0 ? (
            <div className="py-20 text-center">
              <Truck className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600">
                No toll crossing events recorded yet for this trip.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                The {pollInterval >= 60 ? `${Math.round(pollInterval / 60)}m` : `${pollInterval}s`} crawler will automatically record toll plazas as the truck progresses.
              </p>
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* MOBILE TIMELINE (< sm): Clean, single-column vertical highway */}
              {/* ============================================================== */}
              <div className="sm:hidden relative py-4 px-1">
                {/* Left vertical highway line */}
                <div className="absolute left-4 top-1 bottom-4 w-2 bg-[#f59e0b] rounded-full shadow-inner">
                  {/* Upward blue arrow at top */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-blue-600">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[9px] border-b-blue-600"></div>
                  </div>
                </div>

                <div className="space-y-4">
                  {displayEvents.map((ev, index) => {
                    const isLatest = index === 0;
                    const dateStr = extractDateOnly(ev.eventTime);
                    const formattedIST = formatISTTime(ev.eventTime);

                    return (
                      <div key={ev._id || index} className="relative flex items-start gap-3 pl-1">
                        {/* Highway Node Marker */}
                        <div className="relative z-10 flex-shrink-0 w-6 flex items-center justify-center pt-2.5">
                          {isLatest ? (
                            <div className="relative flex items-center justify-center">
                              <div className="absolute w-6 h-6 rounded-full bg-red-400/40 animate-ping"></div>
                              <div className="w-4.5 h-4.5 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-white border-[2.5px] border-[#0d5f96] shadow-xs"></div>
                          )}
                        </div>

                        {/* Full-width Responsive Toll Card */}
                        <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          {/* Card Header Banner */}
                          <div className="bg-[#0d5f96] text-white px-3 py-1.5 flex items-center justify-between gap-1">
                            <span className="font-bold text-xs uppercase tracking-wide truncate">
                              {ev.locName}
                            </span>
                            <span className="text-[9px] font-semibold bg-white/20 px-1.5 py-0.5 rounded text-white flex-shrink-0">
                              {dateStr}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="p-2.5 flex items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-1.5 text-sky-700 min-w-0">
                              <Truck className="w-3.5 h-3.5 flex-shrink-0 text-[#0d5f96]" />
                              <span className="font-bold text-[11px] text-[#0d5f96] truncate">
                                {ev.eventName || 'TOLL PLAZA CROSSED'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-red-600 flex-shrink-0 font-mono">
                              {formattedIST}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================== */}
              {/* DESKTOP TIMELINE (sm:): Alternating Center Highway (Image 1) */}
              {/* ============================================================== */}
              <div className="hidden sm:block relative max-w-3xl mx-auto py-8">
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
                              <div className="bg-[#0d5f96] text-white px-4 py-2 font-semibold text-xs tracking-wide uppercase chevron-banner-right pr-6">
                                {ev.locName}
                              </div>
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
                            <div className="relative flex items-center justify-center">
                              <div className="absolute w-7 h-7 rounded-full bg-red-400/40 animate-ping"></div>
                              <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-4.5 h-4.5 rounded-full bg-white border-[3px] border-[#0d5f96] shadow-sm"></div>
                          )}
                        </div>

                        {/* Right Side Slot */}
                        <div className="w-[45%] flex justify-start">
                          {!isLeft ? (
                            <div className="w-full max-w-sm rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white transform hover:-translate-y-0.5 transition duration-150">
                              <div className="bg-[#0d5f96] text-white px-4 py-2 font-semibold text-xs tracking-wide uppercase chevron-banner-left pl-6">
                                {ev.locName}
                              </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
