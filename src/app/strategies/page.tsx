"use client";

import { useState } from "react";
import StrategyList from "@/components/StrategyList";
import SavedStrategiesList from "@/components/SavedStrategiesList";

export default function StrategiesPage() {
  const [activeTab, setActiveTab] = useState<"discover" | "saved">("discover");

  return (
    <div className="pb-10 md:pb-0">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("discover")}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "discover"
              ? "border-[#5F79F1] text-[#5F79F1]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Discover Strategies
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "saved"
              ? "border-[#5F79F1] text-[#5F79F1]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          My Saved Strategies
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "discover" && <StrategyList />}
      {activeTab === "saved" && <SavedStrategiesList />}
    </div>
  );
}
