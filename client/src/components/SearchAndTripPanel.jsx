import React, { useState, useEffect } from 'react';
import {
  Search,
  Truck,
  Plus,
  Clock,
  MapPin,
  Calendar,
  RefreshCw,
  FileDown,
  Navigation,
  StopCircle,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Radio,
  X,
} from 'lucide-react';
import { exportTruckReportToPdf } from '../utils/pdfExport';
import { fetchTripDetails } from '../api/client';

export default function SearchAndTripPanel({
  trips = [],
  activeTab = 'ACTIVE',
  activeCount = 0,
  pastCount = 0,
  onTabChange,
  selectedTrip,
  selectedTripEvents = [],
  onSelectTrip,
  onOpenNewTripModal,
  onSyncSmts,
  isSyncingSmts = false,
  onOpenTimeline,
  onManualPoll,
  onEndTrip,
  onDeleteTrip,
  searchQuery,
  onSearchChange,
  isPolling,
  pollInterval = 1800,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const [confirmEndId, setConfirmEndId] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Real-time 1-second ticker for live polling indicator
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPollStatusText = (lastPolledAt) => {
    if (!lastPolledAt) return 'Queued for poll...';
    const diffSec = Math.max(0, Math.floor((now - new Date(lastPolledAt).getTime()) / 1000));
    if (diffSec < 5) return 'Polled just now';
    if (diffSec < 60) return `Polled ${diffSec}s ago`;
    const min = Math.floor(diffSec / 60);
    return `Polled ${min}m ago`;
  };

  const getNextCountdown = (lastPolledAt) => {
    if (!lastPolledAt) return pollInterval >= 60 ? `~${Math.round(pollInterval / 60)}m` : `~${pollInterval}s`;
    const diffSec = Math.floor((now - new Date(lastPolledAt).getTime()) / 1000);
    const remain = Math.max(0, pollInterval - (diffSec % pollInterval));
    if (remain >= 60) {
      const m = Math.floor(remain / 60);
      const s = remain % 60;
      return `${m}m ${s}s`;
    }
    return `${remain}s`;
  };

  // Format date DD-MM-YYYY
  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDownloadPdf = async (trip, e) => {
    e.stopPropagation();
    setDownloadingPdfId(trip._id);
    try {
      // 1. If currently selected with loaded events, export immediately
      if (selectedTrip?._id === trip._id && selectedTripEvents && selectedTripEvents.length > 0) {
        exportTruckReportToPdf(selectedTrip, selectedTripEvents);
        return;
      }

      // 2. Otherwise fetch the trip details (including full events list) from API
      const data = await fetchTripDetails(trip._id);
      if (data && data.events && data.events.length > 0) {
        exportTruckReportToPdf(data.trip || trip, data.events);
      } else {
        // Fallback to server endpoint
        window.open(`/api/trips/${trip._id}/pdf`, '_blank');
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
      // Fallback: direct server download
      window.open(`/api/trips/${trip._id}/pdf`, '_blank');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-40 w-full h-[100dvh] max-h-[100dvh]
        md:static md:w-96 md:h-full
        bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-2xl md:shadow-sm
        transition-all duration-300 ease-in-out transform
        ${
          isMobileOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto visible'
            : '-translate-x-full opacity-0 pointer-events-none invisible md:translate-x-0 md:opacity-100 md:pointer-events-auto md:visible'
        }
      `}
    >
      {/* Top Header */}
      <div className="p-4 sm:p-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.jpg"
              alt="SMTS Tracking"
              className="w-9 h-9 rounded-xl object-contain shadow-sm border border-slate-100"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">SMTS Tracking</h1>
              <p className="text-[11px] text-gray-400">Real Time Vehicle Tracking</p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition active:scale-95"
              title="Close sidebar and view map"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Search input pill */}
        <div className="mt-4 relative flex items-center">
          <div className="absolute left-3.5 text-gray-400 pointer-events-none">
            <Truck className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Enter vehicle number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value.toUpperCase())}
            className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-inner"
          />
          <button
            onClick={() => {}}
            className="absolute right-1.5 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition shadow-sm"
            title="Search"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons: Register New Trip & Sync SMTS Slips */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onOpenNewTripModal}
            className="py-2 px-2.5 bg-[#0d5f96] hover:bg-[#0b5180] active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            title="Manually register a vehicle for tracking"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">New Trip</span>
          </button>

          {onSyncSmts && (
            <button
              onClick={onSyncSmts}
              disabled={isSyncingSmts}
              className="py-2 px-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-60"
              title="Sync any newly entered loading slips from SMTS automatically"
            >
              <RefreshCw className={`w-3.5 h-3.5 flex-shrink-0 ${isSyncingSmts ? 'animate-spin' : ''}`} />
              <span className="truncate">{isSyncingSmts ? 'Syncing...' : 'Sync Slips'}</span>
            </button>
          )}
        </div>

        {/* Tabs: Active vs Past */}
        <div className="mt-4 flex border-b border-gray-200">
          <button
            onClick={() => onTabChange('ACTIVE')}
            className={`flex-1 pb-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'ACTIVE'
                ? 'border-[#0d5f96] text-[#0d5f96]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <span>Active</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'ACTIVE'
                  ? 'bg-sky-100 text-[#0d5f96]'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('PAST')}
            className={`flex-1 pb-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'PAST'
                ? 'border-[#0d5f96] text-[#0d5f96]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <span>Past</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'PAST'
                  ? 'bg-sky-100 text-[#0d5f96]'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {pastCount}
            </span>
          </button>
        </div>
      </div>

      {/* Trip List / Empty State */}
      <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-2.5 space-y-3 min-h-0 overscroll-contain">
        {trips.length === 0 ? (
          // Matching Image 2 placeholder
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
              <MapPin className="w-5 h-5 stroke-[1.5]" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              {searchQuery
                ? 'No matching vehicles found'
                : 'Search to view toll crossings'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Click "+ Register New Trip" to start tracking a truck.
            </p>
          </div>
        ) : (
          trips.map((trip) => {
            const isSelected = selectedTrip?._id === trip._id;
            const isTripActive = trip.status === 'ACTIVE';

            return (
              <div
                key={trip._id}
                onClick={() => {
                  onSelectTrip(trip);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`p-3 rounded-xl border cursor-pointer transition duration-150 ${
                  isSelected
                    ? 'border-[#0d5f96] bg-sky-50/50 shadow-sm ring-1 ring-[#0d5f96]/30'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                }`}
              >
                {/* Vehicle Number & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 tracking-wider">
                      {trip.vehicleNumber}
                    </span>
                    {isTripActive && (
                      <span className="relative flex h-2 w-2" title="Tracking Live">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {trip.sourceSlipNumber && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                        title={`Imported from SMTS Loading Slip #${trip.sourceSlipNumber}`}
                      >
                        Slip #{trip.sourceSlipNumber}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isTripActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : trip.status === 'SCHEDULED'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>
                </div>

                {/* Route: From -> To */}
                {(trip.origin || trip.destination) && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 bg-slate-100/80 border border-slate-200/80 px-2 py-1 rounded-lg">
                    <Navigation className="w-3 h-3 text-sky-600 flex-shrink-0" />
                    <span className="truncate">
                      {trip.origin || 'N/A'} <span className="text-gray-400 font-normal">➔</span> {trip.destination || 'N/A'}
                    </span>
                    {trip.estimatedDistanceKm && (
                      <span className="ml-auto text-[10px] font-bold text-emerald-700 flex-shrink-0 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                        ~{trip.estimatedDistanceKm} km
                      </span>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
                  </span>
                </div>

                {/* Latest Toll Status */}
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Latest Toll</span>
                    <span className="text-[#0d5f96] font-bold">
                      {trip.totalTolls || 0} tolls
                    </span>
                  </div>
                  {trip.latestToll?.locName ? (
                    <div className="mt-0.5">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {trip.latestToll.locName}
                      </p>
                      <p className="text-[10px] font-semibold text-red-600">
                        {trip.latestToll.eventTime || 'Just now'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic mt-0.5">
                      Awaiting first toll detection...
                    </p>
                  )}
                </div>

                {/* Live 60s Poller Status Badge */}
                {isTripActive && (
                  <div className="mt-2 flex items-center justify-between px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px]">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>{getPollStatusText(trip.lastPolledAt)}</span>
                    </div>
                    <span className="text-emerald-700 font-mono text-[9px] bg-emerald-100/70 px-1.5 py-0.5 rounded font-semibold">
                      next in {getNextCountdown(trip.lastPolledAt)}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5 text-[11px] flex-wrap sm:flex-nowrap">
                  {/* Timeline button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTrip(trip);
                      onOpenTimeline();
                    }}
                    className="flex-1 min-h-[34px] py-1 px-2.5 bg-sky-50 hover:bg-sky-100 text-[#0d5f96] font-semibold rounded-lg flex items-center justify-center gap-1 transition active:scale-95"
                    title="View Toll Timeline"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Timeline</span>
                  </button>

                  {/* Export PDF */}
                  <button
                    onClick={(e) => handleDownloadPdf(trip, e)}
                    disabled={downloadingPdfId === trip._id}
                    className="min-h-[34px] py-1 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50"
                    title="Download PDF Report"
                  >
                    <FileDown
                      className={`w-3.5 h-3.5 ${downloadingPdfId === trip._id ? 'animate-bounce' : ''}`}
                    />
                    <span>{downloadingPdfId === trip._id ? 'Exporting...' : 'PDF'}</span>
                  </button>

                  {/* Poll Now (if active) */}
                  {isTripActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onManualPoll(trip._id);
                      }}
                      disabled={isPolling}
                      className="min-h-[34px] py-1 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition active:scale-95 flex items-center justify-center"
                      title="Poll LDB Now"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`}
                      />
                    </button>
                  )}

                  {/* End Tracking (if active) */}
                  {isTripActive && (
                    <>
                      {confirmEndId === trip._id ? (
                        <div
                          className="flex items-center gap-1 min-h-[34px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onEndTrip(trip._id);
                              setConfirmEndId(null);
                            }}
                            className="min-h-[34px] px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px]"
                            title="Confirm Stop"
                          >
                            Stop?
                          </button>
                          <button
                            onClick={() => setConfirmEndId(null)}
                            className="min-h-[34px] px-2 py-1 text-gray-400 hover:text-gray-600 rounded-lg text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmEndId(trip._id);
                          }}
                          className="min-h-[34px] py-1 px-2 text-amber-600 hover:bg-amber-50 rounded-lg transition active:scale-95 flex items-center justify-center"
                          title="Stop Tracking Trip"
                        >
                          <StopCircle className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  {/* Delete Trip */}
                  {!isTripActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Delete trip record for ${trip.vehicleNumber}?`
                          )
                        ) {
                          onDeleteTrip(trip._id);
                        }
                      }}
                      className="min-h-[34px] py-1 px-2 text-gray-400 hover:text-red-600 rounded-lg transition active:scale-95 flex items-center justify-center"
                      title="Delete Trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info with safe area for iPhone bar */}
      <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{pollInterval >= 60 ? `${Math.round(pollInterval / 60)}m` : `${pollInterval}s`} Live Crawler Active</span>
        </div>
        <span className="text-gray-400">Past retention: 30d</span>
      </div>
    </div>
  );
}

