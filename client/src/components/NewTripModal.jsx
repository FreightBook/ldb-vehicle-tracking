import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Truck,
  AlertCircle,
  Clock,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Route,
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';
import CityAutocomplete from './CityAutocomplete';
import { estimateRouteDays } from '../utils/indianCities';

function addDaysToDateString(dateStr, days) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d + days);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateDateDiffDays(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export default function NewTripModal({ isOpen, onClose, onSubmitSuccess, pollInterval = 1800 }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originLocation, setOriginLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [routeEstimate, setRouteEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Re-calculate route distance & suggested days when origin or destination changes
  useEffect(() => {
    const originTarget = originLocation || origin;
    const destTarget = destinationLocation || destination;

    if (origin && destination && origin.trim() && destination.trim()) {
      const est = estimateRouteDays(originTarget, destTarget);
      if (est) {
        setRouteEstimate(est);
        // Automatically calculate suggested end date: startDate + est.suggestedDays
        const suggestedEnd = addDaysToDateString(startDate, est.suggestedDays);
        setEndDate(suggestedEnd);
      } else {
        setRouteEstimate(null);
      }
    } else {
      setRouteEstimate(null);
    }
  }, [origin, destination, originLocation, destinationLocation]);

  if (!isOpen) return null;

  // Calculate max end date (startDate + 30 days)
  const calcMaxEndDate = () => {
    if (!startDate) return '';
    return addDaysToDateString(startDate, 30);
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    if (routeEstimate) {
      // Re-apply suggested duration relative to new start date
      setEndDate(addDaysToDateString(val, routeEstimate.suggestedDays));
    } else if (endDate < val) {
      setEndDate(val);
    }
  };

  const handleAdjustDays = (delta) => {
    const currentDiff = calculateDateDiffDays(startDate, endDate);
    const newDiff = Math.max(1, Math.min(30, currentDiff + delta));
    setEndDate(addDaysToDateString(startDate, newDiff));
  };

  const currentDurationDays = calculateDateDiffDays(startDate, endDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleaned = vehicleNumber.toUpperCase().replace(/[\s-]/g, '').trim();
    if (!cleaned || cleaned.length < 5) {
      setError('Please enter a valid vehicle registration number (e.g. TN74BE7362)');
      return;
    }

    if (startDate < todayStr) {
      setError('Start date cannot be in the past. Please select today or a future date.');
      return;
    }

    if (endDate < startDate) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    if (currentDurationDays > 30) {
      setError('Trip duration cannot exceed 30 days.');
      return;
    }

    setLoading(true);
    try {
      await onSubmitSuccess({
        vehicleNumber: cleaned,
        origin: origin ? origin.trim() : '',
        destination: destination ? destination.trim() : '',
        originCoords: originLocation
          ? { lat: originLocation.lat, lng: originLocation.lng }
          : routeEstimate?.origin?.lat
          ? { lat: routeEstimate.origin.lat, lng: routeEstimate.origin.lng }
          : null,
        destinationCoords: destinationLocation
          ? { lat: destinationLocation.lat, lng: destinationLocation.lng }
          : routeEstimate?.destination?.lat
          ? { lat: routeEstimate.destination.lat, lng: routeEstimate.destination.lng }
          : null,
        estimatedDistanceKm: routeEstimate ? routeEstimate.roadDistanceKm : null,
        suggestedDurationDays: routeEstimate ? routeEstimate.suggestedDays : null,
        startDate,
        endDate,
      });
      setVehicleNumber('');
      setOrigin('');
      setDestination('');
      setRouteEstimate(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2.5 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[94dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden border border-gray-100 transform transition-all">
        {/* Header */}
        <div className="bg-[#132238] px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate leading-tight">Register Vehicle Trip</h2>
              <p className="text-[11px] sm:text-xs text-gray-300 truncate">
                Start {pollInterval >= 60 ? `${Math.round(pollInterval / 60)}m` : `${pollInterval}s`} automated LDB toll tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition flex-shrink-0 ml-2"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container with Pinned Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Scrollable Form Body */}
          <div className="p-3.5 sm:p-5 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Vehicle Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Vehicle Registration Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. TN74BE7362 / MH12AB1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3.5 py-2.5 pl-10 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold tracking-wide text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                />
                <Truck className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Indian commercial truck format (letters and digits without spaces)
              </p>
            </div>

            {/* Route: From & To with Indian City Suggestions */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5 text-sky-800">
                  <Route className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span>Trip Route & Distance Estimation</span>
                </div>
                <span className="text-[10px] text-gray-400 font-normal">Optional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Origin (From) */}
                <CityAutocomplete
                  label="From (Origin)"
                  placeholder="City name or 6-digit PIN"
                  value={origin}
                  onChange={(val) => {
                    setOrigin(val);
                    setOriginLocation(null);
                  }}
                  onSelectCity={(loc) => setOriginLocation(loc)}
                  accentColor="sky"
                  icon={MapPin}
                />

                {/* Destination (To) */}
                <CityAutocomplete
                  label="To (Destination)"
                  placeholder="City name or 6-digit PIN"
                  value={destination}
                  onChange={(val) => {
                    setDestination(val);
                    setDestinationLocation(null);
                  }}
                  onSelectCity={(loc) => setDestinationLocation(loc)}
                  accentColor="emerald"
                  icon={MapPin}
                />
              </div>

              {/* Route Estimation Suggestion Card */}
              {routeEstimate ? (
                <div className="p-3 bg-gradient-to-br from-sky-50/90 via-emerald-50/40 to-teal-50/60 border border-sky-200/90 rounded-xl space-y-2.5 shadow-xs animate-fadeIn">
                  {/* Top Bar: Sparkle & Distance Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3 h-3 fill-amber-500" />
                      </span>
                      <span className="text-[11px] font-bold text-slate-800 tracking-wide uppercase">
                        Route Calculation
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 text-xs font-extrabold bg-emerald-600 text-white rounded-full shadow-xs tracking-tight">
                      ~{routeEstimate.roadDistanceKm.toLocaleString()} km
                    </span>
                  </div>

                  {/* Structured Origin -> Destination Path */}
                  <div className="bg-white/90 rounded-lg p-2.5 border border-sky-100/90 grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                    {/* Origin Side */}
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-sky-700 uppercase tracking-wider block">
                        Origin
                      </span>
                      <p
                        className="text-xs font-bold text-gray-900 truncate"
                        title={routeEstimate.origin.city || routeEstimate.origin.name}
                      >
                        {routeEstimate.origin.city || routeEstimate.origin.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {routeEstimate.origin.state}
                        {routeEstimate.origin.pincode ? ` • ${routeEstimate.origin.pincode}` : ''}
                      </p>
                    </div>

                    {/* Connecting Arrow */}
                    <div className="flex flex-col items-center justify-center px-1 text-sky-500 flex-shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>

                    {/* Destination Side */}
                    <div className="min-w-0 text-right">
                      <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Destination
                      </span>
                      <p
                        className="text-xs font-bold text-gray-900 truncate"
                        title={routeEstimate.destination.city || routeEstimate.destination.name}
                      >
                        {routeEstimate.destination.city || routeEstimate.destination.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {routeEstimate.destination.state}
                        {routeEstimate.destination.pincode ? ` • ${routeEstimate.destination.pincode}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Suggested Duration & Auto-applied Note */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-1 pt-0.5">
                    <div className="flex items-center gap-1">
                      <span>Suggested Duration:</span>
                      <strong className="text-sky-900 font-extrabold">
                        {routeEstimate.suggestedDays} {routeEstimate.suggestedDays === 1 ? 'Day' : 'Days'}
                      </strong>
                      <span className="text-slate-400 text-[10px]">(150 km/day formula)</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      End date auto-applied ✓
                    </span>
                  </div>
                </div>
              ) : origin && destination ? (
                <div className="text-[11px] text-amber-800 bg-amber-50/90 border border-amber-200/90 rounded-lg p-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                  <span>Custom locations entered. Tracking duration can be set manually below.</span>
                </div>
              ) : null}
            </div>

            {/* Date Row */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={todayStr}
                      value={startDate}
                      onChange={handleStartDateChange}
                      required
                      className="w-full px-3 py-2 pl-9 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition min-h-[38px]"
                    />
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Today or future date</p>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={startDate || todayStr}
                      max={calcMaxEndDate()}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 pl-9 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition min-h-[38px]"
                    />
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Max 30 days duration</p>
                </div>
              </div>

              {/* Quick Duration Adjuster Pill */}
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>
                    Tracking Window:{' '}
                    <strong className="text-gray-900">
                      {currentDurationDays} {currentDurationDays === 1 ? 'day' : 'days'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustDays(-1)}
                    disabled={currentDurationDays <= 1}
                    title="Decrease 1 day"
                    className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 active:scale-95 rounded-md disabled:opacity-30 transition touch-manipulation"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-gray-400 px-1 font-medium">Adjust</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustDays(1)}
                    disabled={currentDurationDays >= 30}
                    title="Increase 1 day"
                    className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 active:scale-95 rounded-md disabled:opacity-30 transition touch-manipulation"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Automated Trip Lifecycle (Compact responsive grid) */}
            <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs mb-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                <span>Automated Trip Lifecycle</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5 text-[10.5px] leading-relaxed text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                  <span>Polls LDB every {pollInterval >= 60 ? `${Math.round(pollInterval / 60)}m` : `${pollInterval}s`} while active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                  <span>Auto-ends at 23:59 on end date</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                  <span>Manual "End Tracking" anytime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                  <span>30-day trip history retention</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Pinned Footer with Action buttons */}
          <div className="bg-white border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-end gap-2.5 flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#0d5f96] hover:bg-[#0b5180] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition flex items-center gap-1.5 touch-manipulation"
            >
              {loading ? (
                <span>Registering...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Start Tracking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
