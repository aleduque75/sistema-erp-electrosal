// apps/frontend/src/components/ui/date-input.tsx
import * as React from 'react';
import { cn } from "@/lib/utils";
import { IMaskInput, IMaskInputProps } from 'react-imask';

type DateInputProps = IMaskInputProps<HTMLInputElement> & React.InputHTMLAttributes<HTMLInputElement> & {
  onAccept: (value: any, mask: any) => void;
};

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ onAccept, ...props }, ref) => {
    const { max, min, ...restProps } = props; // Omitir max e min
    return (
      <IMaskInput
        mask={"00/00/0000" as any}
        lazy={false}
        onAccept={onAccept}
        inputRef={ref as React.Ref<HTMLInputElement>}
        overwrite
        {...restProps}
        as="input" // Usa a tag input diretamente
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          props.className
        )}
      />
    );
  }
);
DateInput.displayName = 'DateInput';

export { DateInput };