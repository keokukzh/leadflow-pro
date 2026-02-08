"use client";

import { DeviceType } from "./LivePreview";

interface DeviceToggleProps {
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

export function DeviceToggle({ device, onDeviceChange }: DeviceToggleProps) {
  const devices: { type: DeviceType; icon: string; label: string }[] = [
    { type: "desktop", icon: "🖥️", label: "Desktop" },
    { type: "tablet", icon: "📱", label: "Tablet" },
    { type: "mobile", icon: "📲", label: "Mobile" }
  ];

  return (
    <div className="flex bg-slate-100 rounded-lg p-1">
      {devices.map(({ type, icon, label }) => (
        <button
          key={type}
          onClick={() => onDeviceChange(type)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
            device === type 
              ? "bg-white shadow text-slate-800" 
              : "text-slate-500 hover:text-slate-700"
          }`}
          title={label}
        >
          <span>{icon}</span>
        </button>
      ))}
    </div>
  );
}

interface DeviceButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function DeviceButton({ icon, label, isActive, onClick }: DeviceButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${
        isActive 
          ? "bg-white shadow text-slate-800" 
          : "text-slate-500 hover:text-slate-700"
      }`}
      title={label}
    >
      <span>{icon}</span>
    </button>
  );
}
