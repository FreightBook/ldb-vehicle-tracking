import React from 'react';
import {
  MapPin,
  Navigation,
  Layers,
  Truck,
  LayoutDashboard,
  Wallet,
  CreditCard,
  History,
  LogOut,
} from 'lucide-react';

export default function Sidebar({ activeNav = 'Trip', onNavChange }) {
  const menuItems = [
    { id: 'Trip', label: 'Trip', icon: Navigation },
    { id: 'Services', label: 'Services', icon: Layers },
    { id: 'Fleet', label: 'Fleet', icon: Truck },
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Wallet', label: 'Wallet', icon: Wallet },
    { id: 'Payments', label: 'Payments', icon: CreditCard },
    { id: 'Search History', label: 'Search History', icon: History },
  ];

  return (
    <aside className="w-18 md:w-20 bg-[#132238] flex flex-col items-center py-4 justify-between border-r border-[#1e3352] z-20 select-none flex-shrink-0">
      {/* Brand Icon */}
      <div className="flex flex-col items-center gap-1 mb-4">
        <div className="w-11 h-11 rounded-xl bg-[#1b3a61] border border-[#2c5385] flex flex-col items-center justify-center text-white shadow-md">
          <MapPin className="w-5 h-5 text-sky-400" />
          <span className="text-[7px] font-bold tracking-tight uppercase">FASTag</span>
        </div>
        <span className="text-[9px] text-gray-300 font-medium">Location</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col items-center gap-2 w-full px-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange && onNavChange(item.id)}
              className={`w-full py-2.5 px-1 flex flex-col items-center gap-1 rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-[#1e3352] text-white shadow-inner font-semibold'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-[#1a2d47]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-gray-400'}`} />
              <span className="text-[10px] text-center leading-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="w-full px-2 pt-2 border-t border-[#1e3352]/60">
        <button
          onClick={() => alert('Logistics Vehicle Tracking System')}
          className="w-full py-2 flex flex-col items-center gap-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[10px]">Logout</span>
        </button>
      </div>
    </aside>
  );
}

