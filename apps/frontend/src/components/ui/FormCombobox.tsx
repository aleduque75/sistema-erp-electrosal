// Cole este código em: src/components/ui/FormCombobox.tsx

"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
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

interface FormComboboxProps {
  items: { value: string; label: string }[];
  value: string | null;
  onSelect: (value: string) => void;
  searchPlaceholder?: string;
  notFoundText?: string;
  triggerPlaceholder?: string;
}

export function FormCombobox({
  items,
  value,
  onSelect,
  searchPlaceholder = "Buscar item...",
  notFoundText = "Nenhum item encontrado.",
  triggerPlaceholder = "Selecione um item...",
}: FormComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = React.useMemo(() => {
    if (!value) return triggerPlaceholder;
    const selectedItem = items.find((item) => item.value === value);
    return selectedItem ? selectedItem.label : triggerPlaceholder;
  }, [value, items, triggerPlaceholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{notFoundText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={(currentLabel) => {
                    const selectedItem = items.find(
                      (i) =>
                        i.label.toLowerCase() === currentLabel.toLowerCase()
                    );
                    if (selectedItem) {
                      onSelect(selectedItem.value);
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
