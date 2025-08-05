"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Service, getAllServices } from "@/types/ServiceType";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactServiceSearchProps {
  onSearch?: (service: Service | null, searchQuery: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const CompactServiceSearch: React.FC<CompactServiceSearchProps> = ({
  onSearch,
  placeholder = "Service suchen...",
  className,
  size = "md",
}) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const services = getAllServices();

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10",
    lg: "h-12",
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSearchQuery(service);
    setIsOpen(false);
    if (onSearch) {
      onSearch(service, service);
    }
  };

  const handleDirectSearch = () => {
    if (onSearch) {
      onSearch(selectedService, searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDirectSearch();
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={isOpen}
            className={cn(
              "justify-between font-normal min-w-[200px]",
              sizeClasses[size]
            )}>
            {selectedService || "Service wählen"}
            <ChevronDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[300px] p-0' align='start'>
          <Command>
            <CommandInput placeholder='Service suchen...' className='h-9' />
            <CommandEmpty>Keine Dienstleistung gefunden.</CommandEmpty>
            <CommandList className='max-h-48'>
              <CommandGroup>
                {services.map((service) => (
                  <CommandItem
                    key={service}
                    value={service}
                    onSelect={() => handleServiceSelect(service)}
                    className='cursor-pointer'>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedService === service
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {service}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className='flex flex-1 max-w-xs'>
        <Input
          type='text'
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className={cn("rounded-r-none", sizeClasses[size])}
        />
        <Button
          onClick={handleDirectSearch}
          className={cn(
            "rounded-l-none bg-primary hover:bg-primary/90 px-3",
            sizeClasses[size]
          )}
          disabled={!searchQuery.trim()}>
          <Search className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
};

export default CompactServiceSearch;
