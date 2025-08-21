import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Package, 
  ShoppingCart, 
  Receipt, 
  FileText, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  User, // Icon for profile
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // 1. Get isStaff from the AuthContext
  const { signOut, isAdmin, isStaff, profile, user } = useAuth(); 
  const { toast } = useToast();

  // --- Define navigation items for different roles ---

  // For "pure" admins who are NOT staff
  const adminNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/sales', label: 'Sales', icon: ShoppingCart },
    { path: '/expense', label: 'Expenses', icon: Receipt },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/AdvancedAnalytics', label: 'Analytics', icon: BarChart3 },
  ];

  // 2. Create a new navigation set specifically for Staff
  const staffNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/sales', label: 'Sales', icon: ShoppingCart },
  ];

  const customerNavItems = [
    { path: '/dashboard', label: 'My Dashboard', icon: BarChart3 },
    { path: '/sales', label: 'Create Sale', icon: ShoppingCart },
  ];

  // 3. Update the logic to select the correct nav items
  //    - Check for staff first, then admin, then default to customer.
  const navItems = isStaff ? staffNavItems : (isAdmin ? adminNavItems : customerNavItems);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
      navigate('/auth'); // Redirect to login page after logout
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };
  
  // Helper to navigate and close the mobile menu simultaneously
  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SuperMarket</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className="flex items-center space-x-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Desktop User Profile Menu */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  My Account
                  <div className="font-normal text-sm text-muted-foreground truncate">
                    {/* 4. CORRECTED: Use profile.name instead of full_name */}
                    {profile?.name || user?.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-50 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button (Hamburger/X) */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full justify-start flex items-center space-x-2 text-base py-6"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </Button>
              ))}
              
              <div className="pt-4 border-t border-gray-200 mt-4">
                <Button
                    variant={isActive('/profile') ? "secondary" : "ghost"}
                    onClick={() => handleNavigate('/profile')}
                    className="w-full justify-start flex items-center space-x-2 text-base py-6"
                >
                    <User className="h-5 w-5 mr-3" />
                    <span>Profile</span>
                </Button>
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start flex items-center space-x-2 text-base py-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
