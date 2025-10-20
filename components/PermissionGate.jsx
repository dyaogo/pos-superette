import { useAuth } from '../src/contexts/AuthContext';

/**
 * Composant pour afficher du contenu selon les permissions
 * Usage: <PermissionGate permission="manage_users">...</PermissionGate>
 */
export default function PermissionGate({ 
  children, 
  permission, 
  roles, 
  fallback = null 
}) {
  const { hasPermission, hasRole } = useAuth();

  // Vérifier les rôles si fournis
  if (roles) {
    if (!hasRole(roles)) {
      return fallback;
    }
  }

  // Vérifier la permission si fournie
  if (permission) {
    if (!hasPermission(permission)) {
      return fallback;
    }
  }

  return children;
}