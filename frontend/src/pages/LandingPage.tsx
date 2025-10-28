import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import ContactForm from '../components/forms/ContactForm';
import { 
  CreditCard, 
  Bitcoin, 
  Shield, 
  Zap,
  ArrowRight,
  BarChart3,
  Lock,
  MessageCircle
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show landing page to non-authenticated users
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <img src="/assets/psp-icon.png" alt="HighrPay" className="h-8 w-8" />
                <span className="text-xl font-bold text-gray-900">HighrPay</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="outline">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Payment Processing
            <span className="block text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Accept payments, manage balances, and withdraw funds seamlessly. 
            Built for businesses that need reliable, secure payment infrastructure.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Free to get started
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to accept payments
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help you manage your payment operations efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Payment Requests
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Create and manage payment requests with real-time tracking and automated settlement processing.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Bitcoin className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Crypto Withdrawals
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Withdraw your funds instantly via cryptocurrency. Support for major coins and tokens.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Real-time Analytics
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track your business performance with comprehensive dashboards and detailed reporting.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Fast Settlement
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get your funds quickly with automated settlement cycles and instant balance updates.
              </p>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Advanced Security
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Enterprise-grade security with 2FA, role-based access control, and encrypted data storage.
              </p>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Compliance Ready
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Built with compliance in mind. KYC verification, transaction monitoring, and audit trails.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Have questions about our payment platform? Want to learn more about how we can help your business? 
              We'd love to hear from you. Send us a message and our team will get back to you as soon as possible.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Quick Response</p>
                  <p className="text-sm text-gray-600">We typically respond within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Expert Support</p>
                  <p className="text-sm text-gray-600">Our team is here to help you succeed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">No Obligation</p>
                  <p className="text-sm text-gray-600">Just a friendly conversation about your needs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <Card className="border-2 shadow-xl">
            <CardContent className="p-8">
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-blue-600 text-white">
          <CardContent className="p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses already using HighrPay to power their payments
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-6"
                >
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} HighrPay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

