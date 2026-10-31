import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Truck, Eye, EyeOff } from 'lucide-react';
import { verifyAccessCode, setStoredAccessCode } from '../api/client';

export default function PasscodeGate({ onAuthorized }) {
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the access passcode');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyAccessCode(code);
      setStoredAccessCode(code.trim());
      onAuthorized();
    } catch (err) {
      setError(err.message || 'Incorrect passcode. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#0c1626] via-[#132238] to-[#0f2d4a] p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7 border border-slate-100 flex flex-col items-center animate-fadeIn">
        {/* Logo Badge */}
        <img
          src="/favicon.jpg"
          alt="SMTS Tracking"
          className="w-20 h-20 rounded-full object-cover shadow-xl shadow-sky-900/30 mb-4 border-2 border-white ring-2 ring-sky-100"
        />

        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight text-center">
          SMTS Vehicle Tracking
        </h1>
        <p className="text-xs text-gray-500 mt-1 mb-6 text-center">
          Authorized fleet tracking portal. Please enter your access passcode to continue.
        </p>

        {error && (
          <div className="w-full mb-4 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter Access Passcode..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d5f96] focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 transition"
              title={showPassword ? 'Hide passcode' : 'Show passcode'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray-600" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0d5f96] hover:bg-[#0b5180] active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Unlock Tracker</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Private Access Protected</span>
        </div>
      </div>
    </div>
  );
}

