"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceSearchBarProps {
  placeholder?: string;
  className?: string;
  redirectPath?: string;
}

const ServiceSearchBar: React.FC<ServiceSearchBarProps> = ({
  placeholder = "Service oder Suchbegriff eingeben...",
  className,
  redirectPath = "/auftrag-erstellen",
}) => {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [inputMode, setInputMode] = useState<"select" | "search">("select");

  const services = getAllServices();

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSearchQuery(service);
    setIsOpen(false);
    setInputMode("select");
  };

  const handleClearService = () => {
    setSelectedService(null);
    setSearchQuery("");
    setInputMode("select");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (selectedService) {
      params.set("service", selectedService);
    }

    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }

    const searchUrl = `${redirectPath}?${params.toString()}`;
    router.push(searchUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-4xl gap-2 flex-wrap md:flex-nowrap",
        className
      )}>
      <div className='flex-1 min-w-0 relative'>
        {inputMode === "select" ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={isOpen}
                className='w-full justify-between h-12 text-left font-normal'
                onClick={() => setIsOpen(!isOpen)}>
                {selectedService || "Dienstleistung auswählen..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-full p-0' align='start'>
              <Command>
                <CommandInput
                  placeholder='Service suchen...'
                  className='h-10'
                />
                <CommandEmpty>Keine Dienstleistung gefunden.</CommandEmpty>
                <CommandList className='max-h-60'>
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
        ) : (
          <Input
            type='text'
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className='h-12 pr-10'
            autoFocus
          />
        )}

        <Search className='h-4 w-4 absolute right-5 top-1/2 transform -translate-y-1/2 p-0' />
      </div>

      {selectedService && inputMode === "select" && (
        <Button
          variant='outline'
          onClick={handleClearService}
          className='h-12 px-4 w-full md:w-auto'>
          Zurücksetzen
        </Button>
      )}

      <Button
        onClick={handleSearch}
        className='h-12 px-6 bg-primary hover:bg-primary/90 w-full md:w-auto'
        disabled={!searchQuery.trim()}>
        <Search className='h-4 w-4 mr-2' />
        Suchen
      </Button>
    </div>
  );
};

export default ServiceSearchBar;
