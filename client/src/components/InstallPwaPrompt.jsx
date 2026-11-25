import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const isOpenRef = useRef(false);
  isOpenRef.current = isOpen;

  useEffect(() => {
    // 1. Check if already installed in standalone / PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check for iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) &&
      !window.MSStream &&
      !isStandalone;
    setIsIOS(isIOSDevice);

    // 3. Capture native PWA install prompt (Chrome, Android, Edge, Desktop Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Track user activity (passive listeners to ensure zero lag / high FPS)
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    // 5. 30-Second Interval Timer (Only shows if user is actively using the web app)
    const intervalTimer = setInterval(() => {
      // Don't show if already installed
      if (isInstalled) return;

      // Don't show if already open
      if (isOpenRef.current) return;

      // Don't show if browser tab is in background
      if (typeof document !== 'undefined' && document.hidden) return;

      // Only show if user has actively interacted within the last 45 seconds
      const isUserActivelyUsing = Date.now() - lastActivityRef.current < 45000;
      if (!isUserActivelyUsing) return;

      // If Android/Chrome/Desktop has deferred prompt OR iOS Safari:
      setIsOpen(true);
    }, 30000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      clearInterval(intervalTimer);
    };
  }, [isInstalled]);

  // Handle native install trigger
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setIsOpen(false);
          setDeferredPrompt(null);
        } else {
          // User declined native dialog: close popup, will only re-check after 30s
          setIsOpen(false);
        }
      } catch (err) {
        setIsOpen(false);
      }
    } else if (isIOS) {
      setShowIOSTip(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setShowIOSTip(false);
    // Reset activity timestamp so it requires active usage before next 30s check
    lastActivityRef.current = Date.now();
  };

  if (isInstalled || !isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-3 sm:bottom-6 right-3 sm:right-6 z-50 max-w-[calc(100vw-1.5rem)] sm:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white/95 backdrop-blur-md border border-sky-200/80 shadow-2xl rounded-2xl p-3.5 sm:p-4 text-gray-800 transition-all">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="SMTS Logo"
              className="w-11 h-11 rounded-xl shadow-xs border border-gray-100 object-cover flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                  Install SMTS Tracking
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 uppercase tracking-wide">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                Fast 1-tap home screen access & full screen tracking.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition active:scale-95 flex-shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS installation tip instructions */}
        {showIOSTip && (
          <div className="mt-3 p-2.5 bg-sky-50 border border-sky-100 rounded-xl text-[11px] text-sky-900 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1 text-sky-950">
              <Smartphone className="w-3.5 h-3.5" />
              How to install on iPhone / iPad:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sky-800">
              <li>
                Tap the <Share className="w-3.5 h-3.5 inline mx-0.5 text-sky-600" />{' '}
                <strong>Share</strong> button in Safari's bottom toolbar.
              </li>
              <li>
                Scroll down and tap{' '}
                <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-sky-600" />.
              </li>
            </ol>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
          >
            Later
          </button>

          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-[#0d5f96] hover:bg-[#0b5180] active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        </div>
      </div>
    </div>
  );
}
