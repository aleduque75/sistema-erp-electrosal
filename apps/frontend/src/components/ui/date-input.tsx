// apps/frontend/src/components/ui/date-input.tsx
import * as React from 'react';
import { IMaskInput } from 'react-imask';
import { Input } from '@/components/ui/input';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onAccept: (value: any, mask: any) => void;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ onAccept, ...props }, ref) => {
    return (
      <IMaskInput
        mask="00/00/0000"
        radix="."
        lazy={false}
        onAccept={onAccept}
        inputRef={ref as React.Ref<HTMLInputElement>}
        overwrite
        {...props}
        as={Input} // Usa o nosso componente <Input> do Shadcn para o estilo
      />
    );
  }
);
DateInput.displayName = 'DateInput';

export { DateInput };