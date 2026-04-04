import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  BookOpen, 
  FileText, 
  Search, 
  User as UserIcon,
  BarChart3,
  Globe,
  Award,
  Edit,
  Eye,
  ShieldCheck,
  LayoutGrid,
  Users,
  Info,
  Upload,
  Menu as MenuIcon,
  X,
  Home,
  Star,
  Target,
  Phone,
  Archive as ArchiveIcon
} from "lucide-react";
import AfriSciLogo from "./components/brand/AfriSciLogo";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Footer from "./components/layout/Footer"; // Import the new Footer component

// Mock User service for demonstration
const User = {
  me: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ role: 'admin', full_name: 'Dr. Amara Okafor', editor_roles: ['1', '2'] });
      }, 100);
    });
  },
};

const mainMenuItems = [
  {
    title: "About",
    icon: Info,
    highlight: false,
    items: [
      { 
        title: "Our Mission", 
        url: createPageUrl("About"), 
        description: "Advancing African scientific research globally",
        icon: Target
      },
      { 
        title: "Editorial Board", 
        url: createPageUrl("Editorial"), 
        description: "Meet our distinguished international editors",
        icon: Users
      },
      { 
        title: "Open Access Policy", 
        url: createPageUrl("OpenAccess"), 
        description: "Free access to quality African research",
        icon: Globe
      },
      { 
        title: "Contact Us", 
        url: createPageUrl("Contact"), 
        description: "Get in touch with our editorial team",
        icon: Phone
      }
    ]
  },
  {
    title: "Browse",
    icon: Search,
    highlight: true,
    items: [
      { 
        title: "All Journals", 
        url: createPageUrl("Journals"), 
        description: "Explore 50+ peer-reviewed journals",
        icon: BookOpen,
        badge: "50+ Journals"
      },
      { 
        title: "Latest Publications", 
        url: createPageUrl("Publications"), 
        description: "Browse recent research articles",
        icon: FileText,
        badge: "New"
      },
      { 
        title: "By Discipline", 
        url: createPageUrl("Journals"), 
        description: "Find journals in your research field",
        icon: LayoutGrid
      },
      { 
        title: "Most Cited", 
        url: createPageUrl("Publications?sort=citations"), 
        description: "Discover high-impact research",
        icon: Star,
        badge: "Popular"
      },
      { 
        title: "Research Archive", 
        url: createPageUrl("Archive"), 
        description: "Browse our complete publication history",
        icon: ArchiveIcon
      }
    ]
  },
  {
    title: "For Authors",
    icon: Edit,
    highlight: true,
    items: [
      { 
        title: "Register as Author", 
        url: createPageUrl("Apply?role=author"), 
        description: "Create your author account to start submitting",
        icon: UserIcon,
        featured: true,
        badge: "Free"
      },
      { 
        title: "Submit Manuscript", 
        url: createPageUrl("Submit"), 
        description: "AI-powered submission system",
        icon: Upload,
        badge: "AI Enhanced"
      },
      { 
        title: "Submission Guidelines", 
        url: createPageUrl("Guidelines"), 
        description: "Step-by-step submission process",
        icon: FileText
      },
      { 
        title: "Track Submission", 
        url: createPageUrl("MyManuscripts"), 
        description: "Real-time manuscript status",
        icon: BarChart3
      },
      { 
        title: "Author Resources", 
        url: createPageUrl("AuthorResources"), 
        description: "Writing tools and templates",
        icon: BookOpen
      },
      { 
        title: "LaTeX Proof Generator", 
        url: createPageUrl("LaTeXProof"), 
        description: "Convert LaTeX to PDF proof before submission",
        icon: FileText,
        badge: "New"
      }
    ]
  },
  {
    title: "For Reviewers",
    icon: Eye,
    highlight: false,
    items: [
      { 
        title: "Become a Reviewer", 
        url: createPageUrl("Apply?role=reviewer"), 
        description: "Apply to join 500+ expert reviewers",
        icon: UserIcon,
        featured: true,
        badge: "Apply Now"
      },
      { 
        title: "Reviewer Dashboard", 
        url: createPageUrl("ReviewerDashboard"), 
        description: "Manage your review assignments",
        icon: BarChart3
      },
      { 
        title: "Review Guidelines", 
        url: createPageUrl("ReviewGuidelines"), 
        description: "Best practices for peer review",
        icon: FileText
      },
      { 
        title: "Reviewer Awards", 
        url: createPageUrl("ReviewerAwards"), 
        description: "Recognition for outstanding reviewers",
        icon: Award
      }
    ]
  },
  {
    title: "For Editors",
    icon: ShieldCheck,
    highlight: false,
    items: [
      { 
        title: "Apply as Editor", 
        url: createPageUrl("Apply?role=editor"), 
        description: "Join our editorial board",
        icon: UserIcon,
        featured: true,
        badge: "Apply Now"
      },
      { 
        title: "Editor Dashboard", 
        url: createPageUrl("EditorDashboard"), 
        description: "Manage journal submissions",
        icon: Edit
      },
      { 
        title: "Editorial Board", 
        url: createPageUrl("Editorial"), 
        description: "Meet our editorial team",
        icon: Users
      }
    ]
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    User.me().then(setUser).catch(() => setUser(null));
  }, []);
  
  // Do not render layout on the new Home page
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  const userRoles = ['user'];
  if (user) {
    if (user.role === 'admin') userRoles.push('admin');
    if (user.editor_roles && user.editor_roles.length > 0) userRoles.push('editor');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <style>
        {`
          :root {
            --primary: #1E40AF; /* blue-800 */
            --primary-foreground: #FFFFFF;
            --secondary: #1E3A8A; /* blue-900 */
            --accent: #0D9488; /* teal-600 */
            --accent-foreground: #FFFFFF;
            --background: #F8FAFC; /* slate-50 */
            --foreground: #0F172A; /* slate-900 */
            --muted: #F1F5F9;
            --muted-foreground: #64748B;
            --border: #E2E8F0;
          }
          
          .menu-item-featured {
            background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); /* teal-500 to teal-600 */
            color: white;
            border: 2px solid #14B8A6;
          }
          
          .menu-item-featured:hover {
            background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); /* teal-600 to teal-700 */
            transform: translateY(-1px);
            box-shadow: 0 8px 25px rgba(20, 184, 166, 0.3);
          }
          
          .dropdown-shadow {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }
        `}
      </style>

      {/* Visual Header Section */}
      <header className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white overflow-hidden shadow-xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #14B8A6 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, #38BDF8 0%, transparent 50%)`
          }}></div>
        </div>
        
        {/* Header Content */}
        <div className="relative">
          {/* Top Bar */}
          <div className="border-b border-blue-700/50 bg-black/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-12 text-sm">
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-sky-200 text-xs sm:text-sm truncate">🌍 Serving 54 African Countries</span>
                  <span className="text-sky-200 text-xs hidden md:inline">📊 10,000+ Published Articles</span>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {user ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-3 h-3" />
                      </div>
                      <span className="text-teal-200 text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-[120px]">{user.full_name}</span>
                      {user.role === 'admin' && <Badge className="bg-red-500 text-white text-xs hidden sm:flex">Admin</Badge>}
                      {user.editor_roles?.length > 0 && <Badge className="bg-sky-500 text-white text-xs hidden sm:flex">Editor</Badge>}
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-white hover:text-teal-300 text-xs sm:text-sm">
                      Login / Register
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Header */}
          <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-6">
                {/* Logo Section */}
                <Link to={createPageUrl("Home")} className="flex items-center">
                  <AfriSciLogo variant="header" theme="dark" />
                </Link>

                {/* Desktop Quick Actions */}
                <div className="hidden lg:flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <Search className="w-4 h-4 text-sky-200" />
                    <input 
                      type="text" 
                      placeholder="Search journals, articles..." 
                      className="bg-transparent text-white placeholder-sky-300 border-none outline-none text-sm w-64"
                    />
                  </div>
                  
                  <Link to={createPageUrl("Submit")}>
                    <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Article
                    </Button>
                  </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-white"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="relative z-20 bg-white/5 backdrop-blur-md border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="hidden lg:block">
                <NavigationMenu>
                  <NavigationMenuList className="flex items-center space-x-1 py-4">
                    {/* Home Link */}
                    <NavigationMenuItem>
                      <Link
                        to={createPageUrl("Home")}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        <Home className="w-4 h-4" />
                        Home
                      </Link>
                    </NavigationMenuItem>

                    {mainMenuItems.map((menu) => (
                      <NavigationMenuItem key={menu.title}>
                        <Link to={menu.items[0]?.url || '#'} className="w-full">
                          <NavigationMenuTrigger className={`flex items-center gap-2 text-white hover:text-teal-300 font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-colors ${
                            menu.highlight ? 'bg-white/5 border border-white/20' : ''
                          }`}>
                            <menu.icon className="w-4 h-4" />
                            {menu.title}
                            {menu.highlight && <Badge className="bg-teal-500 text-white text-xs ml-2">Popular</Badge>}
                          </NavigationMenuTrigger>
                        </Link>
                        <NavigationMenuContent>
                          <div className="w-96 p-6 bg-white dropdown-shadow border-t-4 border-teal-500">
                            <div className="grid gap-4">
                              <div className="mb-2">
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                  <menu.icon className="w-5 h-5 text-teal-600" />
                                  {menu.title}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                  {menu.title === 'About' && 'Learn about our mission and team'}
                                  {menu.title === 'Browse' && 'Discover research across all disciplines'}
                                  {menu.title === 'For Authors' && 'Tools and resources for researchers'}
                                  {menu.title === 'For Reviewers' && 'Join our peer review community'}
                                </p>
                              </div>
                              {menu.items.map((item) => (
                                <Link
                                  key={item.title}
                                  to={item.url}
                                  className={`block p-4 rounded-lg hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-200 group ${
                                    item.featured ? 'menu-item-featured' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${item.featured ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-teal-100'} transition-colors`}>
                                      <item.icon className={`w-4 h-4 ${item.featured ? 'text-white' : 'text-slate-600 group-hover:text-teal-600'}`} />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-semibold ${item.featured ? 'text-white' : 'text-slate-900'} group-hover:text-teal-700 transition-colors`}>
                                          {item.title}
                                        </h4>
                                        {item.badge && (
                                          <Badge className={`text-xs ${item.featured ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>
                                            {item.badge}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className={`text-sm ${item.featured ? 'text-white/80' : 'text-slate-600'} transition-colors`}>
                                        {item.description}
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    ))}

                    {/* Role-based Navigation */}
                    {user && (userRoles.includes('admin') || userRoles.includes('editor') || user.reviewer_status === 'active') && (
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="flex items-center gap-2 text-amber-300 hover:text-amber-200 font-medium px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-400/30">
                          <ShieldCheck className="w-4 h-4" />
                          Editorial
                          <Badge className="bg-amber-400 text-amber-900 text-xs ml-2">Staff</Badge>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="w-80 p-6 bg-white dropdown-shadow border-t-4 border-amber-500">
                            <div className="grid gap-4">
                              <div className="mb-2">
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                                  Editorial Access
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Manage journals and peer review</p>
                              </div>
                              
                              {user.reviewer_status === 'active' && (
                                <Link to={createPageUrl("ReviewerDashboard")} className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <Eye className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900">Reviewer Dashboard</h4>
                                    <p className="text-sm text-slate-600">Manage review assignments</p>
                                  </div>
                                </Link>
                              )}
                              
                              {(userRoles.includes('editor') || userRoles.includes('admin')) && (
                                <Link to={createPageUrl("EditorDashboard")} className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                                  <div className="p-2 bg-teal-100 rounded-lg">
                                    <Edit className="w-4 h-4 text-teal-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900">Editor Dashboard</h4>
                                    <p className="text-sm text-slate-600">Manage journal submissions</p>
                                  </div>
                                </Link>
                              )}
                              
                              {userRoles.includes('admin') && (
                                <Link to={createPageUrl("AdminDashboard")} className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                                  <div className="p-2 bg-red-100 rounded-lg">
                                    <ShieldCheck className="w-4 h-4 text-red-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900">Admin Dashboard</h4>
                                    <p className="text-sm text-slate-600">Platform administration</p>
                                  </div>
                                </Link>
                              )}
                            </div>
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    )}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-white/10">
              <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                <Link
                  to={createPageUrl("Home")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
                {mainMenuItems.map((menu) => (
                  <div key={menu.title}>
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <menu.icon className="w-4 h-4" />
                      {menu.title}
                    </h3>
                    <div className="ml-6 space-y-2">
                      {menu.items.map((item) => (
                        <Link
                          key={item.title}
                          to={item.url}
                          className="block text-slate-300 hover:text-teal-300 text-sm transition-colors py-1"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                {user && (userRoles.includes('admin') || userRoles.includes('editor') || user.reviewer_status === 'active') && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Editorial
                    </h3>
                    <div className="ml-6 space-y-2">
                      {user.reviewer_status === 'active' && (
                        <Link to={createPageUrl("ReviewerDashboard")} 
                          className="block text-slate-300 hover:text-teal-300 text-sm transition-colors py-1"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Reviewer Dashboard
                        </Link>
                      )}
                      {(userRoles.includes('editor') || userRoles.includes('admin')) && (
                        <Link to={createPageUrl("EditorDashboard")} 
                          className="block text-slate-300 hover:text-teal-300 text-sm transition-colors py-1"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Editor Dashboard
                        </Link>
                      )}
                      {userRoles.includes('admin') && (
                        <Link to={createPageUrl("AdminDashboard")} 
                          className="block text-slate-300 hover:text-teal-300 text-sm transition-colors py-1"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm py-3">
            <Link to={createPageUrl("Home")} className="text-slate-500 hover:text-slate-700 transition-colors">
              Home
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-medium">
              {currentPageName === 'Journals' ? 'Browse Journals' :
               currentPageName === 'Publications' ? 'Publications' :
               currentPageName === 'Submit' ? 'Submit Manuscript' :
               currentPageName === 'MyManuscripts' ? 'My Manuscripts' :
               currentPageName === 'Profile' ? 'My Profile' :
               currentPageName === 'AdminDashboard' ? 'Admin Dashboard' :
               currentPageName === 'EditorDashboard' ? 'Editor Dashboard' :
               currentPageName === 'ReviewerDashboard' ? 'Reviewer Dashboard' :
               currentPageName === 'About' ? 'About Us' : // Added breadcrumb mapping
               currentPageName === 'Editorial' ? 'Editorial Board' : // Added breadcrumb mapping
               currentPageName === 'OpenAccess' ? 'Open Access Policy' : // Added breadcrumb mapping
               currentPageName === 'Contact' ? 'Contact Us' : // Added breadcrumb mapping
               currentPageName === 'Guidelines' ? 'Submission Guidelines' : // Added breadcrumb mapping
               currentPageName === 'AuthorResources' ? 'Author Resources' : // Added breadcrumb mapping
               currentPageName === 'ReviewGuidelines' ? 'Reviewer Guidelines' : // Added breadcrumb mapping
               currentPageName === 'ReviewerAwards' ? 'Reviewer Awards' : // Added breadcrumb mapping
               currentPageName || 'Page'}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}