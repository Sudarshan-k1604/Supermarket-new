import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const StrictAdminRoute = ({ children }: { children: React.ReactNode }) => {
  // isStaff is true only if the user is an admin AND is_staff is true
  const { isAdmin, isStaff, loading } = useAuth();

  // Show a loader while the user's role is being determined
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is finished and the user is NOT a strict admin (i.e., they are staff or not an admin at all), redirect them.
  if (!isAdmin || isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  // If the user is a strict admin, show the protected page content
  return <>{children}</>;
};

export default StrictAdminRoute;