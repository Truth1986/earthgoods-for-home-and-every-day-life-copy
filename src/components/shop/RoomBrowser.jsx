import React from 'react';

const rooms = [
  { value: "all", label: "All Rooms", icon: "🏠" },
  { value: "kitchen", label: "Kitchen", icon: "🍳" },
  { value: "bedroom", label: "Bedroom", icon: "🛏️" },
  { value: "bathroom", label: "Bathroom", icon: "🚿" },
  { value: "living_room", label: "Living Room", icon: "🛋️" },
  { value: "dining_room", label: "Dining Room", icon: "🍽️" },
  { value: "outdoor", label: "Outdoor", icon: "🌿" },
  { value: "garage", label: "Garage", icon: "🔧" },
  { value: "office", label: "Office", icon: "💼" },
  { value: "laundry", label: "Laundry", icon: "👕" },
  { value: "entryway", label: "Entryway", icon: "🚪" },
];

export default function RoomBrowser({ selectedRoom, onRoomSelect }) {
  return (
    <div className="w-full overflow-x-auto pb-1 -mx-1 px-1">
      <div className="flex gap-2 min-w-max">
        {rooms.map(room => (
          <button
            key={room.value}
            onClick={() => onRoomSelect(room.value)}
            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border transition-all duration-200 whitespace-nowrap ${
              selectedRoom === room.value
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.03]'
                : 'bg-white border-stone-200 text-stone-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="text-xl leading-none">{room.icon}</span>
            <span className="text-xs font-medium">{room.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}