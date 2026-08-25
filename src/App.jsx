import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ResearcherDirectory from './pages/ResearcherDirectory';
import ResearcherProfile from './pages/ResearcherProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import InstitutionalPartnership from './pages/InstitutionalPartnership';
import Accreditations from './pages/Accreditations';
import PublisherCompliance from './pages/PublisherCompliance';
import ManuscriptEditor from './pages/ManuscriptEditor';
import TermsConditions from './pages/TermsConditions';
import ReviewerPortal from './pages/ReviewerPortal';
import AuthorProfile from './pages/AuthorProfile';
import Editorial from './pages/Editorial';
import Submit from './pages/Submit';
import QuickSubmit from './pages/QuickSubmit';
import ResearchNewsAndAnnouncements from './pages/ResearchNewsAndAnnouncements';
import ResearchNewsArticle from './pages/ResearchNewsArticle';
import FeesWaiverPolicy from './pages/FeesWaiverPolicy';
import ArchivingPolicy from './pages/ArchivingPolicy';
import RepositoryPolicy from './pages/RepositoryPolicy';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Memberships from './pages/Memberships';
import InstitutionDashboard from './pages/InstitutionDashboard';
import SubscriptionAdmin from './pages/SubscriptionAdmin';
import AuthorServices from './pages/AuthorServices';
import WaiverPools from './pages/WaiverPools';
import ServiceOrdersAdmin from './pages/ServiceOrdersAdmin';
import Jobs from './pages/Jobs';
import Advertise from './pages/Advertise';
import Training from './pages/Training';
import VerifyCertificate from './pages/VerifyCertificate';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/ManuscriptEditor" element={<LayoutWrapper currentPageName="ManuscriptEditor"><ManuscriptEditor /></LayoutWrapper>} />
      <Route path="/PrivacyPolicy" element={<LayoutWrapper currentPageName="PrivacyPolicy"><PrivacyPolicy /></LayoutWrapper>} />
      <Route path="/InstitutionalPartnership" element={<LayoutWrapper currentPageName="InstitutionalPartnership"><InstitutionalPartnership /></LayoutWrapper>} />
      <Route path="/Accreditations" element={<LayoutWrapper currentPageName="Accreditations"><Accreditations /></LayoutWrapper>} />
      <Route path="/PublisherCompliance" element={<LayoutWrapper currentPageName="PublisherCompliance"><PublisherCompliance /></LayoutWrapper>} />
      <Route path="/TermsConditions" element={<LayoutWrapper currentPageName="TermsConditions"><TermsConditions /></LayoutWrapper>} />
      <Route path="/ReviewerPortal" element={<LayoutWrapper currentPageName="ReviewerPortal"><ReviewerPortal /></LayoutWrapper>} />
      <Route path="/AuthorProfile" element={<LayoutWrapper currentPageName="AuthorProfile"><AuthorProfile /></LayoutWrapper>} />
      <Route path="/Editorial" element={<LayoutWrapper currentPageName="Editorial"><Editorial /></LayoutWrapper>} />
      <Route path="/Submit" element={<LayoutWrapper currentPageName="Submit"><Submit /></LayoutWrapper>} />
      <Route path="/ResearcherDirectory" element={<LayoutWrapper currentPageName="ResearcherDirectory"><ResearcherDirectory /></LayoutWrapper>} />
      <Route path="/ResearcherProfile" element={<LayoutWrapper currentPageName="ResearcherProfile"><ResearcherProfile /></LayoutWrapper>} />
      <Route path="/QuickSubmit" element={<LayoutWrapper currentPageName="QuickSubmit"><QuickSubmit /></LayoutWrapper>} />
      <Route path="/ResearchNewsAndAnnouncements" element={<LayoutWrapper currentPageName="ResearchNewsAndAnnouncements"><ResearchNewsAndAnnouncements /></LayoutWrapper>} />
      <Route path="/ResearchNewsArticle" element={<LayoutWrapper currentPageName="ResearchNewsArticle"><ResearchNewsArticle /></LayoutWrapper>} />
      <Route path="/FeesWaiverPolicy" element={<LayoutWrapper currentPageName="FeesWaiverPolicy"><FeesWaiverPolicy /></LayoutWrapper>} />
      <Route path="/ArchivingPolicy" element={<LayoutWrapper currentPageName="ArchivingPolicy"><ArchivingPolicy /></LayoutWrapper>} />
      <Route path="/RepositoryPolicy" element={<LayoutWrapper currentPageName="RepositoryPolicy"><RepositoryPolicy /></LayoutWrapper>} />
      <Route path="/Memberships" element={<LayoutWrapper currentPageName="Memberships"><Memberships /></LayoutWrapper>} />
      <Route path="/InstitutionDashboard" element={<LayoutWrapper currentPageName="InstitutionDashboard"><InstitutionDashboard /></LayoutWrapper>} />
      <Route path="/SubscriptionAdmin" element={<LayoutWrapper currentPageName="SubscriptionAdmin"><SubscriptionAdmin /></LayoutWrapper>} />
      <Route path="/AuthorServices" element={<LayoutWrapper currentPageName="AuthorServices"><AuthorServices /></LayoutWrapper>} />
      <Route path="/WaiverPools" element={<LayoutWrapper currentPageName="WaiverPools"><WaiverPools /></LayoutWrapper>} />
      <Route path="/ServiceOrdersAdmin" element={<LayoutWrapper currentPageName="ServiceOrdersAdmin"><ServiceOrdersAdmin /></LayoutWrapper>} />
      <Route path="/Jobs" element={<LayoutWrapper currentPageName="Jobs"><Jobs /></LayoutWrapper>} />
      <Route path="/Advertise" element={<LayoutWrapper currentPageName="Advertise"><Advertise /></LayoutWrapper>} />
      <Route path="/Training" element={<LayoutWrapper currentPageName="Training"><Training /></LayoutWrapper>} />
      <Route path="/VerifyCertificate" element={<LayoutWrapper currentPageName="VerifyCertificate"><VerifyCertificate /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App