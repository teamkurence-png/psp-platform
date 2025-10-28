import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { refreshUser } from '../store/authSlice';

interface AuthInitializerProps {
  children: React.ReactNode;
}

/**
 * Component that initializes auth state on app startup
 * This should only be rendered once at the app root level
 */
const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth state by checking for existing token
    dispatch(refreshUser());
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthInitializer;

