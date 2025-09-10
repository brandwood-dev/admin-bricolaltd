import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

interface SwitchFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// Input Field Component
export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  description,
  placeholder,
  disabled,
  className,
  min,
  max,
  step
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn('text-sm font-medium', required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
        {label}
      </Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500'
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <div id={`${name}-error`} className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Textarea Field Component
export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  required,
  description,
  placeholder,
  disabled,
  rows = 3,
  className
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn('text-sm font-medium', required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
        {label}
      </Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <Textarea
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          error && 'border-red-500 focus-visible:ring-red-500'
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <div id={`${name}-error`} className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Select Field Component
export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  description,
  placeholder,
  disabled,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn('text-sm font-medium', required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
        {label}
      </Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={name}
          className={cn(
            error && 'border-red-500 focus:ring-red-500'
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div id={`${name}-error`} className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Switch Field Component
export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  name,
  checked,
  onChange,
  error,
  required,
  description,
  disabled,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={name} className={cn('text-sm font-medium', required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
            {label}
          </Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <Switch
          id={name}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>
      {error && (
        <div id={`${name}-error`} className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Form Section Component for grouping fields
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Form Error Summary Component
interface FormErrorSummaryProps {
  errors: Record<string, string>;
  className?: string;
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  className
}) => {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div className={cn('rounded-md bg-red-50 border border-red-200 p-4', className)}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Please fix the following errors:
          </h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
            {errorEntries.map(([field, error]) => (
              <li key={field}>
                <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span> {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};