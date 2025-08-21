// src/pages/Auth.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Mail, Lock, KeyRound } from 'lucide-react'; // NEW: Import KeyRound icon
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client'; // NEW: Import supabase client

// NEW: Define the possible views
type AuthView = 'signin' | 'signup' | 'forgotpassword' | 'resetpassword';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // NEW: For password reset
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, requestPasswordReset, updateUserPassword } = useAuth(); // MODIFIED: Get new functions
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<AuthView>('signin'); // MODIFIED: State to control view

  // NEW: Effect to detect password recovery token from URL
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('resetpassword');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Sign In Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Signed in successfully!" });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account Created", description: "Please check your email for a verification link." });
      setEmail('');
      setPassword('');
      setView('signin');
    }
    setLoading(false);
  };

  // NEW: Handler for forgot password form
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await requestPasswordReset(email);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "A password reset link has been sent to your email address." });
      setView('signin');
    }
    setLoading(false);
  };

  // NEW: Handler for reset password form
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await updateUserPassword(password);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Your password has been reset successfully. Please sign in." });
      setPassword('');
      setConfirmPassword('');
      // Navigate to clear URL params and show sign-in form
      navigate('/'); 
      setView('signin');
    }
    setLoading(false);
  };

  // Function to render the correct form based on the current view
  const renderForm = () => {
    switch (view) {
      case 'signup':
        return (
          <form onSubmit={handleSignUp} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input id="signup-password" type="password" placeholder="Create a password (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
            <p className="text-center text-sm text-gray-600">Already have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setView('signin')}>Sign In</Button></p>
          </form>
        );
      case 'forgotpassword':
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input id="forgot-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending link..." : "Send Reset Link"}</Button>
            <p className="text-center text-sm text-gray-600"><Button variant="link" className="p-0 h-auto" onClick={() => setView('signin')}>Back to Sign In</Button></p>
          </form>
        );
      case 'resetpassword':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input id="reset-password" type="password" placeholder="Enter your new password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input id="confirm-password" type="password" placeholder="Confirm your new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required /></div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</Button>
          </form>
        );
      case 'signin':
      default:
        return (
          <form onSubmit={handleSignIn} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required /></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Password</Label>
                <Button variant="link" type="button" className="p-0 h-auto text-xs" onClick={() => setView('forgotpassword')}>Forgot Password?</Button>
              </div>
              <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input id="signin-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required /></div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
            <p className="text-center text-sm text-gray-600">Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setView('signup')}>Sign Up</Button></p>
          </form>
        );
    }
  };

  // Function to get the title and description for the card header
  const getCardDetails = () => {
    switch (view) {
      case 'signup': return { title: 'Create an Account', description: 'Enter your details to get started' };
      case 'forgotpassword': return { title: 'Forgot Password', description: 'Enter your email to receive a reset link' };
      case 'resetpassword': return { title: 'Reset Your Password', description: 'Enter and confirm your new password' };
      case 'signin':
      default: return { title: 'Welcome Back', description: 'Sign in to your account to continue' };
    }
  };

  const { title, description } = getCardDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-blue-600 p-3 rounded-xl"><Package className="h-8 w-8 text-white" /></div>
            <h1 className="text-3xl font-bold text-gray-900">VendorFlow</h1>
          </div>
          <p className="text-gray-600">Manage your business with ease</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderForm()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;