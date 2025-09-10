import React from "react";

export default function DriverSchedule() {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow px-4 py-3">
        <h1 className="text-lg font-bold text-gray-800">Schedule</h1>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-md w-80 text-center">
          <h2 className="text-xl font-bold mb-2">Schedule</h2>
          <p className="text-gray-600">This is where schedule details will appear.</p>
        </div>
      </main>
    </div>
  );
}
