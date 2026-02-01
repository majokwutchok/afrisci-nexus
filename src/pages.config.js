/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Dashboard from './pages/Dashboard';
import Journals from './pages/Journals';
import Submit from './pages/Submit';
import MyManuscripts from './pages/MyManuscripts';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import EditorDashboard from './pages/EditorDashboard';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ManuscriptDetail from './pages/ManuscriptDetail';
import Publications from './pages/Publications';
import Home from './pages/Home';
import About from './pages/About';
import Editorial from './pages/Editorial';
import OpenAccess from './pages/OpenAccess';
import Contact from './pages/Contact';
import Guidelines from './pages/Guidelines';
import AuthorResources from './pages/AuthorResources';
import Search from './pages/Search';
import ReviewGuidelines from './pages/ReviewGuidelines';
import ReviewerAwards from './pages/ReviewerAwards';
import JournalDetail from './pages/JournalDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Journals": Journals,
    "Submit": Submit,
    "MyManuscripts": MyManuscripts,
    "Profile": Profile,
    "AdminDashboard": AdminDashboard,
    "EditorDashboard": EditorDashboard,
    "ReviewerDashboard": ReviewerDashboard,
    "ManuscriptDetail": ManuscriptDetail,
    "Publications": Publications,
    "Home": Home,
    "About": About,
    "Editorial": Editorial,
    "OpenAccess": OpenAccess,
    "Contact": Contact,
    "Guidelines": Guidelines,
    "AuthorResources": AuthorResources,
    "Search": Search,
    "ReviewGuidelines": ReviewGuidelines,
    "ReviewerAwards": ReviewerAwards,
    "JournalDetail": JournalDetail,
}

export const pagesConfig = {
    mainPage: "AuthorResources",
    Pages: PAGES,
    Layout: __Layout,
};