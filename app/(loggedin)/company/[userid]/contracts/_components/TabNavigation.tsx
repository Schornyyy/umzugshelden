"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle } from "lucide-react";

interface TabNavigationProps {
  activeTab: "available" | "purchased";
  onTabChange: (tab: "available" | "purchased") => void;
  availableCount: number;
  purchasedCount: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  availableCount,
  purchasedCount,
}) => {
  return (
    <div className='flex space-x-4 mb-6'>
      <Button
        variant={activeTab === "available" ? "default" : "outline"}
        onClick={() => onTabChange("available")}
        className='flex items-center space-x-2'>
        <MapPin className='h-4 w-4' />
        <span>Verfügbare Aufträge ({availableCount})</span>
      </Button>
      <Button
        variant={activeTab === "purchased" ? "default" : "outline"}
        onClick={() => onTabChange("purchased")}
        className='flex items-center space-x-2'>
        <CheckCircle className='h-4 w-4' />
        <span>Erworbene Aufträge ({purchasedCount})</span>
      </Button>
    </div>
  );
};
