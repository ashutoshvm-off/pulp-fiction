import React from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ProfileProvider } from './context/ProfileContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { BuildBox } from './pages/subscription/BuildBox';
import { Schedule } from './pages/subscription/Schedule';
import { Success } from './pages/subscription/Success';
import { OurStory } from './pages/OurStory';
import { Profile } from './pages/Profile';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyOTP } from './pages/auth/VerifyOTP';
import { NewPassword } from './pages/auth/NewPassword';
import { Admin } from './pages/Admin';
import { AdminLogin } from './pages/AdminLogin';
import { DeliveryLogin } from './pages/DeliveryLogin';
import { DeliveryDashboard } from './pages/DeliveryDashboard';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <CartProvider>
          <SubscriptionProvider>
            <ProfileProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/our-story" element={<OurStory />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/admin" element={<Admin />} />

                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-otp" element={<VerifyOTP />} />
                  <Route path="/new-password" element={<NewPassword />} />

                  {/* Protected Routes */}
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  <Route path="/subscription" element={<Outlet />}>
                    <Route index element={
                      <div className="flex flex-col items-center w-full">
                        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Build Your Wellness Routine</h1>
                        <p className="text-center text-sage-500 mb-8 max-w-2xl">Customize your box with fresh, organic juices and snacks.</p>
                        <BuildBox />
                      </div>
                    } />
                    <Route path="schedule" element={
                      <div className="flex flex-col items-center w-full">
                        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Set Your Delivery Schedule</h1>
                        <Schedule />
                      </div>
                    } />
                    <Route path="success" element={<Success />} />
                  </Route>
                  <Route path="/delivery-login" element={<DeliveryLogin />} />
                  <Route path="/delivery" element={<DeliveryDashboard />} />
                </Routes>
              </Layout>
            </ProfileProvider>
          </SubscriptionProvider>
        </CartProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;

