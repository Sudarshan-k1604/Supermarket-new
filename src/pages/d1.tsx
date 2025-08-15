// src/pages/CustomerDashboard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LayoutGrid, Archive, Receipt, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CustomerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Hero Section */}
        <section className="text-center py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            Your Personalized Shopping
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              Command Center
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Effortlessly build your cart, manage your orders, and track your purchases all in one place. Welcome to a smarter, more convenient way to shop.
          </p>
          <div className="mt-10">
            <Link to="/sales">
              <Button 
                size="lg"
                className="text-lg font-bold py-7 px-10 rounded-full shadow-lg transition-transform transform hover:scale-105"
              >
                Start Shopping Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              A Seamless Experience, Built For You
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Discover the features that put you in control.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Build Your Order */}
            <Card className="text-center border-2 border-transparent hover:border-primary/50 hover:shadow-xl transition-all">
              <CardHeader className="items-center">
                <div className="flex items-center justify-center h-16 w-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                  <LayoutGrid className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl">Build Your Order with Ease</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Browse our full product catalog. Add items to your cart, adjust quantities, and see your total update in real-time. It's your personal shopping assistant.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2: Flexible Checkout */}
            <Card className="text-center border-2 border-transparent hover:border-primary/50 hover:shadow-xl transition-all">
              <CardHeader className="items-center">
                <div className="flex items-center justify-center h-16 w-16 mb-4 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                  <Archive className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl">Flexible Checkout Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Need to step away? Place your entire cart on hold with a single click. Your order will be safely saved, ready for you to complete payment whenever you're back.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3: Track Purchases */}
            <Card className="text-center border-2 border-transparent hover:border-primary/50 hover:shadow-xl transition-all md:col-span-2 lg:col-span-1">
              <CardHeader className="items-center">
                <div className="flex items-center justify-center h-16 w-16 mb-4 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                  <Receipt className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl">Instant Digital Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Every completed purchase is recorded. Access your order history anytime, view detailed receipts, and even have them sent to your email. Say goodbye to paper clutter.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Final Call to Action Section */}
        <section className="my-16">
          <div className="max-w-4xl mx-auto p-8 md:p-12 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl text-white text-center shadow-2xl">
            <h2 className="text-3xl font-bold">Ready to Transform Your Shopping?</h2>
            <p className="mt-4 text-lg text-gray-300">
              Jump into the Point of Sale and experience the future of retail today.
            </p>
            <div className="mt-8">
              <Link to="/sales">
                <Button 
                  size="lg"
                  variant="secondary"
                  className="text-lg font-bold py-7 px-10 rounded-full bg-white text-primary hover:bg-gray-200"
                >
                  Go to Point of Sale
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default CustomerDashboard;