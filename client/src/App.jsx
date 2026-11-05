import React, { useState, useEffect, useCallback } from 'react';
import SearchAndTripPanel from './components/SearchAndTripPanel';
import LeafletMapView from './components/LeafletMapView';
import NewTripModal from './components/NewTripModal';
import TollTimelineModal from './components/TollTimelineModal';
import PasscodeGate from './components/PasscodeGate';
import {
  fetchTrips,
  fetchTripDetails,
  createTrip,
  manualPollTrip,
  endTrip,
  deleteTrip,
  getStoredAccessCode,
} from './api/client';

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(() => Boolean(getStoredAccessCode()));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [trips, setTrips] = useState([]);
  const [allActiveTrips, setAllActiveTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedTripEvents, setSelectedTripEvents] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);
  const [pollInterval, setPollInterval] = useState(1800);
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load ALL active trips for the fleet overview map (unfiltered, skip if already loaded by loadTrips)
  const loadAllActiveTrips = useCallback(async () => {
    if (activeTab === 'ACTIVE' && !searchQuery) return;
    try {
      const data = await fetchTrips('ACTIVE', '');
      setAllActiveTrips(data.trips || []);
    } catch (err) {
      console.error('Failed to load all active trips:', err);
    }
  }, [activeTab, searchQuery]);

  // Load trips list (filtered by tab and search)
  const loadTrips = useCallback(async () => {
    try {
      const data = await fetchTrips(activeTab, searchQuery);
      setTrips(data.trips || []);
      if (activeTab === 'ACTIVE' && !searchQuery) {
        setAllActiveTrips(data.trips || []);
      }
      if (typeof data.activeCount === 'number') setActiveCount(data.activeCount);
      if (typeof data.pastCount === 'number') setPastCount(data.pastCount);
      if (typeof data.pollIntervalSeconds === 'number') setPollInterval(data.pollIntervalSeconds);

      // If a trip was already selected, update its reference
      if (selectedTrip) {
        const updated = (data.trips || []).find((t) => t._id === selectedTrip._id);
        if (updated) {
          setSelectedTrip(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  }, [activeTab, searchQuery, selectedTrip]);

  // Load specific trip details (with events)
  const loadTripDetails = async (tripId) => {
    try {
      const data = await fetchTripDetails(tripId);
      setSelectedTrip(data.trip);
      setSelectedTripEvents(data.events || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadTrips();
      loadAllActiveTrips();
    }
  }, [isAuthorized, activeTab, searchQuery]);

  // Periodically refresh trips in background (optimized for low bandwidth: only when tab is visible)
  useEffect(() => {
    if (!isAuthorized) return;

    const refreshData = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadTrips();
      loadAllActiveTrips();
      if (selectedTrip && selectedTrip.status === 'ACTIVE') {
        loadTripDetails(selectedTrip._id);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const timer = setInterval(refreshData, 60000);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthorized, loadTrips, loadAllActiveTrips, selectedTrip]);

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    loadTripDetails(trip._id);
    setIsMobileSidebarOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedTrip(null);
    setSelectedTripEvents([]);
  };

  const handleCreateTripSubmit = async (formData) => {
    const res = await createTrip(formData);
    showToast(`Vehicle ${res.trip.vehicleNumber} registered for tracking!`, 'success');
    await loadTrips();
    await loadAllActiveTrips();
    if (res.trip) {
      handleSelectTrip(res.trip);
    }
  };

  const handleManualPoll = async (tripId) => {
    setIsPolling(true);
    try {
      const res = await manualPollTrip(tripId);
      setSelectedTrip(res.trip);
      setSelectedTripEvents(res.events || []);
      await loadTrips();
      if (res.newEventsCount > 0) {
        showToast(
          `Polled LDB: Found ${res.newEventsCount} new toll crossing event(s)!`,
          'success'
        );
      } else {
        showToast('Polled LDB: No new toll events at this moment.', 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsPolling(false);
    }
  };

  const handleEndTrip = async (tripId) => {
    try {
      const res = await endTrip(tripId);
      showToast(`Tracking completed for ${res.trip.vehicleNumber}`, 'info');
      await loadTrips();
      if (selectedTrip?._id === tripId) {
        setSelectedTrip(res.trip);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await deleteTrip(tripId);
      showToast('Trip record deleted', 'info');
      if (selectedTrip?._id === tripId) {
        setSelectedTrip(null);
        setSelectedTripEvents([]);
      }
      await loadTrips();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!isAuthorized) {
    return <PasscodeGate onAuthorized={() => setIsAuthorized(true)} />;
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-gray-100 font-sans relative">
      {/* 1. Search & Trip Management Panel */}
      <SearchAndTripPanel
        trips={trips}
        activeTab={activeTab}
        activeCount={activeCount}
        pastCount={pastCount}
        onTabChange={setActiveTab}
        selectedTrip={selectedTrip}
        selectedTripEvents={selectedTripEvents}
        onSelectTrip={handleSelectTrip}
        onOpenNewTripModal={() => setIsNewTripModalOpen(true)}
        onOpenTimeline={() => setIsTimelineModalOpen(true)}
        onManualPoll={handleManualPoll}
        onEndTrip={handleEndTrip}
        onDeleteTrip={handleDeleteTrip}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isPolling={isPolling}
        pollInterval={pollInterval}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 3. Main Leaflet Interactive Map View */}
      <main className="flex-1 h-full relative">
        <LeafletMapView
          trip={selectedTrip}
          events={selectedTripEvents}
          allTrips={allActiveTrips}
          activeCount={activeCount}
          onSelectTrip={handleSelectTrip}
          onClearSelection={handleClearSelection}
          onOpenTimeline={() => setIsTimelineModalOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
      </main>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold text-white animate-bounce ${
            notification.type === 'error'
              ? 'bg-red-600'
              : notification.type === 'success'
              ? 'bg-emerald-600'
              : 'bg-[#132238]'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* New Trip Registration Modal */}
      <NewTripModal
        isOpen={isNewTripModalOpen}
        onClose={() => setIsNewTripModalOpen(false)}
        onSubmitSuccess={handleCreateTripSubmit}
        pollInterval={pollInterval}
      />

      {/* Toll Timeline Modal (Matching Image 1 UI) */}
      <TollTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        trip={selectedTrip}
        events={selectedTripEvents}
        pollInterval={pollInterval}
      />
    </div>
  );
}

