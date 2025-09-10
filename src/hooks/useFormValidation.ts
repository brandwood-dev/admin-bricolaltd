import { useState, useCallback } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

interface ValidationState {
  errors: Record<string, string>;
  isValid: boolean;
  isValidating: boolean;
}

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showToastOnError?: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  options: UseFormValidationOptions = {}
) {
  const { validateOnChange = true, validateOnBlur = true, showToastOnError = false } = options;
  const { toast } = useToast();
  
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    isValid: true,
    isValidating: false
  });

  const validateForm = useCallback(async (data: T): Promise<{ success: boolean; data?: T; errors?: Record<string, string> }> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const validatedData = await schema.parseAsync(data);
      setValidationState({
        errors: {},
        isValid: true,
        isValidating: false
      });
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        
        setValidationState({
          errors,
          isValid: false,
          isValidating: false
        });
        
        if (showToastOnError) {
          toast({
            title: "Validation Error",
            description: "Please check the form for errors",
            variant: "destructive"
          });
        }
        
        return { success: false, errors };
      }
      
      const generalError = { general: 'Validation failed' };
      setValidationState({
        errors: generalError,
        isValid: false,
        isValidating: false
      });
      
      return { success: false, errors: generalError };
    }
  }, [schema, showToastOnError, toast]);

  const validateField = useCallback(async (fieldName: string, value: any): Promise<string | null> => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.shape?.[fieldName as keyof typeof schema.shape];
      if (fieldSchema) {
        await fieldSchema.parseAsync(value);
        
        // Clear error for this field
        setValidationState(prev => {
          const newErrors = { ...prev.errors };
          delete newErrors[fieldName];
          return {
            ...prev,
            errors: newErrors,
            isValid: Object.keys(newErrors).length === 0
          };
        });
        
        return null;
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || 'Invalid value';
        
        // Set error for this field
        setValidationState(prev => ({
          ...prev,
          errors: { ...prev.errors, [fieldName]: errorMessage },
          isValid: false
        }));
        
        return errorMessage;
      }
      return 'Validation error';
    }
  }, [schema]);

  const clearErrors = useCallback(() => {
    setValidationState({
      errors: {},
      isValid: true,
      isValidating: false
    });
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[fieldName];
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  const getFieldProps = useCallback((fieldName: string) => {
    const hasError = !!validationState.errors[fieldName];
    
    return {
      error: hasError,
      helperText: validationState.errors[fieldName] || '',
      onBlur: validateOnBlur ? () => {
        // Note: This would need the current value, which should be passed from the component
      } : undefined,
      onChange: validateOnChange ? (value: any) => {
        validateField(fieldName, value);
      } : undefined
    };
  }, [validationState.errors, validateOnBlur, validateOnChange, validateField]);

  return {
    errors: validationState.errors,
    isValid: validationState.isValid,
    isValidating: validationState.isValidating,
    validateForm,
    validateField,
    clearErrors,
    clearFieldError,
    getFieldProps,
    hasErrors: Object.keys(validationState.errors).length > 0
  };
}

// Utility function for form submission with validation
export function useValidatedSubmit<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  onSubmit: (data: T) => Promise<void> | void,
  options: UseFormValidationOptions = {}
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateForm } = useFormValidation(schema, options);
  const { toast } = useToast();

  const handleSubmit = useCallback(async (data: T) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const validation = await validateForm(data);
      
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive"
        });
        return;
      }
      
      await onSubmit(validation.data!);
      
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Submission Error",
        description: "An error occurred while submitting the form",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, validateForm, onSubmit, toast]);

  return {
    handleSubmit,
    isSubmitting
  };
}