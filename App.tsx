import React from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { BuildBox } from './pages/subscription/BuildBox';
import { Schedule } from './pages/subscription/Schedule';
import { Success } from './pages/subscription/Success';
import { OurStory } from './pages/OurStory';

const App: React.FC = () => {
  return (
    <HashRouter>
      <CartProvider>
        <SubscriptionProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/our-story" element={<OurStory />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />

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
            </Routes>
          </Layout>
        </SubscriptionProvider>
      </CartProvider>
    </HashRouter>
  );
};

export default App;
