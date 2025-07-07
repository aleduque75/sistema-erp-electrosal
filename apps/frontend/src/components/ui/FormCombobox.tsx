// apps/frontend/src/components/FormCombobox.tsx
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
import { Label } from "@/components/ui/label"; // Para usar a Label

interface Option {
  value: string;
  label: string;
}

interface FormComboboxProps {
  label: string;
  options: Option[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export function FormCombobox({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  emptyMessage = "Nenhum item encontrado.",
  searchPlaceholder = "Pesquisar...",
  disabled = false,
}: FormComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Usamos um valor interno para exibir no botão, que pode ser string vazia
  // mas o valor real (value prop) pode ser null para o backend.
  const displayValue =
    options.find((option) => option.value === value)?.label || "";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {displayValue || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[300px] overflow-y-auto">
          {" "}
          {/* Ajusta largura e altura */}
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  key="clear-selection-item"
                  value="clear-selection" // Permite selecionar "limpar seleção"
                  onSelect={() => {
                    onValueChange(null); // Define como null quando o item vazio é selecionado
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {placeholder}
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // O valor da pesquisa pode ser o label
                    onSelect={(currentLabel) => {
                      const selectedOption = options.find(
                        (o) =>
                          o.label.toLowerCase() === currentLabel.toLowerCase()
                      );
                      onValueChange(
                        selectedOption ? selectedOption.value : null
                      );
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
