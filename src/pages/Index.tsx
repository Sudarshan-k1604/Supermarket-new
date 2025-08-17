import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Leaf, Truck, ArrowRight, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Mock AuthContext for standalone functionality. In a real app, this would be a proper import.
const AuthContext = React.createContext(null);
const useAuth = () => React.useContext(AuthContext);

const Index = () => {
  const navigate = useNavigate();
  // For demonstration, we'll simulate a logged-out user. 
  // In the actual app, useAuth() would provide the real user state.
  const { user } = useAuth() || { user: null };

  // Content is focused on the supermarket's value proposition.
  const features = [
    {
      icon: Leaf,
      title: 'Farm-Fresh Produce',
      description: 'Get the best quality fruits and vegetables, sourced directly from local farms.',
    },
    {
      icon: ShoppingCart,
      title: 'Wide Variety of Goods',
      description: 'From pantry staples to exotic ingredients, we have everything you need.',
    },
    {
      icon: Truck,
      title: 'Fast & Reliable Delivery',
      description: 'Enjoy the convenience of having your groceries delivered right to your doorstep.',
    },
  ];

  // Navigation logic is preserved and updated for context.
  // Logged-in users are directed to the customer-facing POS page.
  const handlePrimaryAction = () => {
    if (user) {
      navigate('/customer-pos');
    } else {
      navigate('/auth');
    }
  };

  return (
    // Wrapping the component with a mock AuthProvider to resolve the context dependency.
    <AuthContext.Provider value={{ user: null }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        {/* Header */}
        <header className="bg-white dark:bg-slate-950/70 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Sri Lakshmi Supermarket
              </span>
            </div>
            <div className="space-x-2">
              {user ? (
                <Button onClick={() => navigate('/customer-pos')}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Shop Now
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main>
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                Fresh Groceries,
                <span className="text-emerald-600"> Delivered Fast</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                Your one-stop shop for fresh produce, pantry staples, and household essentials. Order online and get everything delivered to your doorstep with ease.
              </p>
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                onClick={handlePrimaryAction}
              >
                {user ? "Start Shopping" : "Sign Up for Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </section>

          {/* Features Section */}
          <section className="bg-white dark:bg-slate-950 py-20">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-12">
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                          Why You'll Love Shopping With Us
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 text-lg">
                          We make grocery shopping simple, fast, and fresh.
                      </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                      <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                          <Card className="text-center border-0 shadow-md hover:shadow-xl transition-shadow duration-300 h-full">
                              <CardHeader>
                                  <div className="bg-emerald-100 dark:bg-emerald-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                      <feature.icon className="h-8 w-8 text-emerald-600" />
                                  </div>
                                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                              </CardContent>
                          </Card>
                      </motion.div>
                  ))}
                  </div>
              </div>
          </section>

          {/* Final CTA Section */}
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-8 md:p-12 rounded-2xl text-white text-center max-w-4xl mx-auto">
                  <h3 className="text-3xl font-bold mb-4">Ready to Fill Your Cart?</h3>
                  <p className="mb-6 text-lg opacity-90">
                      Browse our aisles from the comfort of your home. Your next delicious meal starts here.
                  </p>
                  <Button
                      size="lg"
                      variant="secondary"
                      className="text-emerald-600 bg-white hover:bg-slate-100 text-lg px-8 py-6"
                      onClick={handlePrimaryAction}
                  >
                      {user ? "Browse Our Products" : "Create Your Account"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
              </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-slate-800 dark:bg-black text-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Sri Lakshmi Supermarket</span>
            </div>
            <p className="text-slate-400">
              © {new Date().getFullYear()} Sri Lakshmi Supermarket. All Rights Reserved.
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Mandya, Karnataka, India
            </p>
          </div>
        </footer>
      </div>
    </AuthContext.Provider>
  );
};

export default Index;
