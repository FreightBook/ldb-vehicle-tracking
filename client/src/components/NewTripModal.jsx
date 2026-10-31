import React, { useState } from 'react';
import { X, Calendar, Truck, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

export default function NewTripModal({ isOpen, onClose, onSubmitSuccess, pollInterval = 60 }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Calculate max end date (startDate + 30 days)
  const calcMaxEndDate = () => {
    if (!startDate) return '';
    const d = new Date(startDate);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    // If current endDate is before new startDate, bump endDate to startDate
    if (endDate < val) {
      setEndDate(val);
    }
  };

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

    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const diffDays = (endD - startD) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      setError('Trip duration cannot exceed 30 days.');
      return;
    }

    setLoading(true);
    try {
      await onSubmitSuccess({
        vehicleNumber: cleaned,
        startDate,
        endDate,
      });
      setVehicleNumber('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden border border-gray-100 transform transition-all">
        {/* Header */}
        <div className="bg-[#132238] px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Register Vehicle Trip</h2>
              <p className="text-xs text-gray-300">Start {pollInterval}s automated LDB toll tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
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
              <Truck className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Indian commercial truck format (letters and digits without spaces)
            </p>
          </div>

          {/* Date Row */}
          <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 pl-9 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
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
                  className="w-full px-3 py-2 pl-9 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Max 30 days duration</p>
            </div>
          </div>

          {/* Policy notes */}
          <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-1.5 text-[11px] text-slate-700">
            <div className="flex items-center gap-1.5 text-sky-800 font-semibold">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Automated Trip Lifecycle</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
              <li>Polls LDB every {pollInterval} seconds while active</li>
              <li>Auto-completes at 23:59:50 on the end date</li>
              <li>Manual "End Tracking" button available at any time</li>
              <li>Completed logs auto-purged after 30 days</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#0d5f96] hover:bg-[#0b5180] text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition flex items-center gap-1.5"
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

