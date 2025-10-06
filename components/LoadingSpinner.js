export default function LoadingSpinner({ size = 'medium', fullScreen = false }) {
  const sizes = {
    small: 20,
    medium: 40,
    large: 60
  };

  const spinnerSize = sizes[size];

  const spinner = (
    <div style={{
      width: `${spinnerSize}px`,
      height: `${spinnerSize}px`,
      border: '3px solid var(--color-border)',
      borderTop: '3px solid var(--color-primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  );

  if (fullScreen) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--color-bg)'
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}