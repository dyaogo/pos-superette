// Composant Tabs standardisé

export function Tabs({ children, className = '' }) {
  return (
    <div className={`flex gap-sm mb-lg ${className}`} style={{ borderBottom: '2px solid var(--color-border)' }}>
      {children}
    </div>
  );
}

export function Tab({ label, icon: Icon, active, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-sm px-lg py-md rounded-lg transition ${className}`}
      style={{
        background: active ? 'var(--gradient-primary)' : 'transparent',
        color: active ? 'white' : 'var(--color-text-secondary)',
        border: 'none',
        cursor: 'pointer',
        fontWeight: active ? '600' : '400',
        borderRadius: '8px 8px 0 0',
      }}
    >
      {Icon && <Icon size={18} />}
      {label}
    </button>
  );
}

const TabsComponent = Tabs;
TabsComponent.Tab = Tab;

export default TabsComponent;
