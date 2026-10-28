import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { MarketplacePage } from './pages/MarketplacePage';
import { AuctionDetailsPage } from './pages/AuctionDetailsPage';
import { CreateAuctionPage } from './pages/CreateAuctionPage';
import { MyBidsPage } from './pages/MyBidsPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { SavedSearchesPage } from './pages/SavedSearchesPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { SellerDecisionsPage } from './pages/SellerDecisionsPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { QuestionsAnswersPage } from './pages/QuestionsAnswersPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfileTrustPage } from './pages/ProfileTrustPage';
import { AdminModerationPage } from './pages/AdminModerationPage';
import { HandoverPage } from './pages/HandoverPage';
import { SignInPage } from './pages/SignInPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Authenticated Layout Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<MarketplacePage />} />
            <Route path="auctions/:id" element={<AuctionDetailsPage />} />
            <Route path="create-listing" element={<CreateAuctionPage />} />
            <Route path="my-bids" element={<MyBidsPage />} />
            <Route path="watchlist" element={<WatchlistPage />} />
            <Route path="saved-searches" element={<SavedSearchesPage />} />
            <Route path="ai-assistant" element={<AIAssistantPage />} />
            <Route path="seller-decisions" element={<SellerDecisionsPage />} />
            <Route path="my-listings" element={<MyListingsPage />} />
            <Route path="questions-and-answers" element={<QuestionsAnswersPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfileTrustPage />} />
            <Route path="admin" element={<AdminModerationPage />} />
            <Route path="handover/:id" element={<HandoverPage />} />
            <Route path="login" element={<SignInPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
