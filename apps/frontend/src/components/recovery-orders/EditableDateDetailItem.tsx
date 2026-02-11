'use client';

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { format } from 'date-fns';

interface EditableDateDetailItemProps {
  label: string;
  value: Date | undefined;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  editedValue: Date | undefined;
  setEditedValue: (value: Date | undefined) => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  className?: string;
}

export const EditableDateDetailItem = ({
  label,
  value,
  isEditing,
  setIsEditing,
  editedValue,
  setEditedValue,
  isSaving,
  onSave,
  onCancel,
  className = '',
}: EditableDateDetailItemProps) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {isEditing ? (
        <div className="flex items-center gap-2 mt-1">
          <DatePicker
            date={editedValue}
            onDateChange={setEditedValue}
            placeholder={label}
            className="w-auto"
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={onCancel} disabled={isSaving}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className="text-base font-medium">{value ? format(value, "dd/MM/yyyy HH:mm") : "N/A"}</p>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
