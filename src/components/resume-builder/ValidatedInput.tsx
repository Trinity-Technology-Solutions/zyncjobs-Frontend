import React, { useState, useEffect, useRef } from 'react';

export interface ValidatedInputProps {
  id?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  type?: string;
  value: string;
  onCommit: (val: string) => void;
  validator?: (val: string) => string | null;
  placeholder?: string;
  className?: string; // Container className
  inputClassName?: string; // Additional classes for the <input> element
  labelClassName?: string; // Additional classes for the <label> element
  requiredErrorMessage?: string;
  error?: string | null; // External error override if provided
  onBlur?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

/**
 * ValidatedInput
 *
 * Separates draft input (what the user types) from committed resume data (what is saved/rendered).
 * - Keystrokes update local draft state so normal typing is never disrupted or wiped.
 * - When valid, commits to resume store immediately so live preview stays responsive.
 * - When invalid, does NOT commit to resume store. The last valid committed data is preserved,
 *   preventing invalid values from entering store, autosave, and preview.
 * - Displays validation error on blur or when updating an already invalid field.
 * - Synchronizes draft state if store data updates externally (undo, redo, import, AI fill).
 */
export default function ValidatedInput({
  id,
  label,
  required = false,
  hint,
  type = 'text',
  value,
  onCommit,
  validator,
  placeholder,
  className = '',
  inputClassName = '',
  labelClassName = '',
  requiredErrorMessage,
  error: externalError,
  onBlur,
  autoFocus,
  disabled = false,
}: ValidatedInputProps) {
  const safeValue = value ?? '';
  const [draft, setDraft] = useState<string>(safeValue);
  const [localError, setLocalError] = useState<string | null>(null);
  const lastCommittedRef = useRef<string>(safeValue);

  // Sync draft when the store value changes externally (undo/redo, import, AI auto-fill)
  useEffect(() => {
    if (safeValue !== lastCommittedRef.current) {
      setDraft(safeValue);
      lastCommittedRef.current = safeValue;
      setLocalError(null);
    }
  }, [safeValue]);

  const validate = (val: string): string | null => {
    const trimmed = val.trim();
    if (required && !trimmed) {
      return requiredErrorMessage || 'This field is required';
    }
    if (!trimmed) {
      // Non-required empty fields are valid
      return null;
    }
    if (validator) {
      return validator(val);
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setDraft(nextVal);

    const err = validate(nextVal);
    if (!err) {
      // Valid input: clear error and commit immediately
      if (localError) setLocalError(null);
      lastCommittedRef.current = nextVal;
      onCommit(nextVal);
    } else {
      // Invalid input: do NOT commit to store
      // If error is already showing, keep it updated; otherwise wait for blur
      if (localError) {
        setLocalError(err);
      }
    }
  };

  const handleBlur = () => {
    const err = validate(draft);
    setLocalError(err);
    if (!err && draft !== lastCommittedRef.current) {
      lastCommittedRef.current = draft;
      onCommit(draft);
    }
    onBlur?.();
  };

  const activeError = externalError !== undefined ? externalError : localError;
  const hasError = Boolean(activeError);
  const errorId = id ? `${id}-error` : undefined;

  const defaultInputBase = 'w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const errorStyle = hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300';
  const combinedInputClass = `${defaultInputBase} ${errorStyle} ${inputClassName}`.trim();

  const defaultLabelBase = 'block text-xs font-medium text-gray-600 mb-1.5';
  const combinedLabelClass = `${defaultLabelBase} ${labelClassName}`.trim();

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={combinedLabelClass}>
          {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
          {hint && <span className="text-gray-400 font-normal"> {hint}</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-invalid={hasError}
        aria-describedby={hasError && errorId ? errorId : undefined}
        autoFocus={autoFocus}
        disabled={disabled}
        className={combinedInputClass}
      />
      {hasError && (
        <p id={errorId} role="alert" className="text-[11px] text-red-600 mt-1">
          {activeError}
        </p>
      )}
    </div>
  );
}
