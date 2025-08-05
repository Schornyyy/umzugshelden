"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContractFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
  radiusFilter: number;
  onRadiusFilterChange: (value: number) => void;
  services: string[];
  onApplyFilters: () => void;
}

export const ContractFilters: React.FC<ContractFiltersProps> = ({
  searchTerm,
  onSearchChange,
  serviceFilter,
  onServiceFilterChange,
  radiusFilter,
  onRadiusFilterChange,
  services,
  onApplyFilters,
}) => {
  return (
    <Card className='mb-6'>
      <CardContent className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-2'>
              Suchbegriff
            </label>
            <Input
              placeholder='Suche nach Beschreibung, PLZ...'
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>Service</label>
            <Select value={serviceFilter} onValueChange={onServiceFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder='Service wählen' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Alle Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>
              Umkreis (km)
            </label>
            <Select
              value={radiusFilter.toString()}
              onValueChange={(value) => onRadiusFilterChange(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10 km</SelectItem>
                <SelectItem value='25'>25 km</SelectItem>
                <SelectItem value='50'>50 km</SelectItem>
                <SelectItem value='100'>100 km</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-end'>
            <Button onClick={onApplyFilters} className='w-full'>
              Filter anwenden
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
