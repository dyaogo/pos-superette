// Composants Form standardisés

export function FormGroup({ children, className = '' }) {
  return <div className={`mb-md ${className}`}>{children}</div>;
}

export function FormLabel({ children, required, className = '' }) {
  return (
    <label className={`text-md font-medium mb-sm ${className}`} style={{ display: 'block' }}>
      {children}
      {required && <span className="text-danger">*</span>}
    </label>
  );
}

export function FormInput({ type = 'text', className = '', ...props }) {
  return (
    <input
      type={type}
      className={`input-field ${className}`}
      {...props}
    />
  );
}

export function FormSelect({ children, className = '', ...props }) {
  return (
    <select
      className={`input-field cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormTextarea({ rows = 3, className = '', ...props }) {
  return (
    <textarea
      rows={rows}
      className={`input-field ${className}`}
      style={{ resize: 'vertical' }}
      {...props}
    />
  );
}

export function FormActions({ children, className = '' }) {
  return (
    <div className={`flex gap-md mt-md ${className}`}>
      {children}
    </div>
  );
}

const FormComponent = FormGroup;
FormComponent.Label = FormLabel;
FormComponent.Input = FormInput;
FormComponent.Select = FormSelect;
FormComponent.Textarea = FormTextarea;
FormComponent.Actions = FormActions;

export default FormComponent;
