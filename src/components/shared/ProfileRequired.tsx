import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { setAuthReturnTo } from '@/lib/authReturnTo';

interface ProfileRequiredProps {
  reason?: string;
  children: ReactNode;
}

export default function ProfileRequired({
  reason = 'Pour accéder à cette section, veuillez vous connecter avec votre compte.',
  children,
}: ProfileRequiredProps) {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      setAuthReturnTo(location.pathname + location.search);
      navigate('/login', { replace: true, state: { reason } });
    }
  }, [user, isLoadingAuth, navigate, location, reason]);

  // Dès que user est défini, rendre directement les enfants
  if (user) {
    return <>{children}</>;
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return null;
}
