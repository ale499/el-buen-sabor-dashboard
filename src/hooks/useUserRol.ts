// src/hooks/useUserRol.ts
import { useAuth0 } from '@auth0/auth0-react';

export const useUserRol = (): 'ADMIN' | 'CHEF' | 'DELIVERY' => {
  const { user } = useAuth0();

  const roles: string[] = user?.['https://buensabor//roles'] || [];

  if (roles.includes('Administrador')) return 'ADMIN';
  if (roles.includes('CHEF')) return 'CHEF';
  if (roles.includes('DELIVERY')) return 'DELIVERY';

  return 'ADMIN'; // fallback
};
