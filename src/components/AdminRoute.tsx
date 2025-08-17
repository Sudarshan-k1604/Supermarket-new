import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();

  // Show a loader while the user's role is being determined
  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  // If loading is finished and the user is not an admin, redirect them
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // If the user is an admin, show the protected page content
  return <>{children}</>;
};

export default AdminRoute;