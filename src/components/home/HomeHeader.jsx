import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  Globe, 
  Search, 
  Upload,
  User as UserIcon,
  ChevronDown
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function HomeHeader() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl("Search") + `?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const userRoles = ['user'];
  if (user) {
    if (user.role === 'admin') userRoles.push('admin');
    if (user.editor_roles && user.editor_roles.length > 0) userRoles.push('editor');
  }

  return (
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12 text-sm">
              <div className="flex items-center space-x-6">
                <span className="text-sky-200">🌍 Serving 54 African Countries</span>
                <span className="text-sky-200">📊 10,000+ Published Articles</span>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                      <UserIcon className="w-3 h-3" />
                    </div>
                    <span className="text-teal-200">{user.full_name}</span>
                    {user.role === 'admin' && <Badge className="bg-red-500 text-white text-xs">Admin</Badge>}
                    {user.editor_roles?.length > 0 && <Badge className="bg-sky-500 text-white text-xs">Editor</Badge>}
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="text-white hover:text-teal-300">
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
              <Link to={createPageUrl("Home")} className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <Globe className="w-9 h-9 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-sky-300 bg-clip-text text-transparent">
                    AfriSci Nexus
                  </h1>
                  <p className="text-sky-200 font-medium text-sm">
                    African Scientific Excellence Platform
                  </p>
                  <p className="text-blue-300 text-xs">
                    Est. 2024 • Open Access • Peer Reviewed
                  </p>
                </div>
              </Link>

              {/* Desktop Quick Actions */}
              <div className="hidden lg:flex items-center gap-4">
                <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <Search className="w-4 h-4 text-sky-200" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search journals, articles..." 
                    className="bg-transparent text-white placeholder-sky-300 border-none outline-none text-sm w-64"
                  />
                </form>
                
                <Link to={createPageUrl("Submit")}>
                  <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Article
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="relative z-20 bg-white/5 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <NavigationMenu>
              <NavigationMenuList className="flex items-center space-x-1 py-4">
                {/* Home Link */}
                <NavigationMenuItem>
                  <Link
                    to={createPageUrl("Home")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
                  >
                    Home
                  </Link>
                </NavigationMenuItem>

                {/* About Menu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="flex items-center gap-2 text-white hover:text-white font-medium px-4 py-2 rounded-lg bg-blue-800/50 hover:bg-blue-700/70 transition-colors border border-blue-600/30">
                    About
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-80 p-3 bg-white shadow-xl rounded-lg border-t-4 border-blue-500">
                      <Link to={createPageUrl("About")} className="block p-4 rounded-lg hover:bg-blue-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-blue-200">
                        About Us
                      </Link>
                      <Link to={createPageUrl("Editorial")} className="block p-4 rounded-lg hover:bg-blue-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-blue-200">
                        Editorial Board
                      </Link>
                      <Link to={createPageUrl("OpenAccess")} className="block p-4 rounded-lg hover:bg-blue-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-blue-200">
                        Open Access Policy
                      </Link>
                      <Link to={createPageUrl("Contact")} className="block p-4 rounded-lg hover:bg-blue-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-blue-200">
                        Contact Us
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Browse Menu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="flex items-center gap-2 text-white hover:text-white font-medium px-4 py-2 rounded-lg bg-teal-600/60 hover:bg-teal-600/80 transition-colors border border-teal-500/40">
                    Browse
                    <Badge className="bg-teal-400 text-teal-900 text-xs ml-1">Popular</Badge>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-80 p-3 bg-white shadow-xl rounded-lg border-t-4 border-teal-500">
                      <Link to={createPageUrl("Journals")} className="block p-4 rounded-lg hover:bg-teal-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-teal-200">
                        All Journals
                      </Link>
                      <Link to={createPageUrl("Publications")} className="block p-4 rounded-lg hover:bg-teal-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-teal-200">
                        Latest Publications
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* For Authors Menu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="flex items-center gap-2 text-white hover:text-white font-medium px-4 py-2 rounded-lg bg-emerald-600/60 hover:bg-emerald-600/80 transition-colors border border-emerald-500/40">
                    For Authors
                    <Badge className="bg-emerald-400 text-emerald-900 text-xs ml-1">Popular</Badge>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-80 p-3 bg-white shadow-xl rounded-lg border-t-4 border-emerald-500">
                      <Link to={createPageUrl("Submit")} className="block p-4 rounded-lg hover:bg-emerald-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-emerald-200">
                        Submit Manuscript
                      </Link>
                      <Link to={createPageUrl("MyManuscripts")} className="block p-4 rounded-lg hover:bg-emerald-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-emerald-200">
                        Track Submission
                      </Link>
                      <Link to={createPageUrl("Guidelines")} className="block p-4 rounded-lg hover:bg-emerald-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-emerald-200">
                        Submission Guidelines
                      </Link>
                      <Link to={createPageUrl("AuthorResources")} className="block p-4 rounded-lg hover:bg-emerald-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-emerald-200">
                        Author Resources
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* For Reviewers Menu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="flex items-center gap-2 text-white hover:text-white font-medium px-4 py-2 rounded-lg bg-blue-700/50 hover:bg-blue-700/70 transition-colors border border-blue-600/30">
                    For Reviewers
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-80 p-3 bg-white shadow-xl rounded-lg border-t-4 border-blue-500">
                      <Link to={createPageUrl("ReviewerDashboard")} className="block p-4 rounded-lg hover:bg-blue-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-blue-200">
                        Reviewer Dashboard
                      </Link>
                      <Link to={createPageUrl("Profile")} className="block p-4 rounded-lg hover:bg-blue-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-blue-200">
                        Become a Reviewer
                      </Link>
                      <Link to={createPageUrl("ReviewGuidelines")} className="block p-4 rounded-lg hover:bg-blue-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-blue-200">
                        Review Guidelines
                      </Link>
                      <Link to={createPageUrl("ReviewerAwards")} className="block p-4 rounded-lg hover:bg-blue-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-blue-200">
                        Reviewer Awards
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Editorial Menu - For Staff Only */}
                {user && (userRoles.includes('admin') || userRoles.includes('editor') || user.reviewer_status === 'active') && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center gap-2 text-white hover:text-white font-medium px-4 py-2 rounded-lg bg-amber-600/70 hover:bg-amber-600/90 transition-colors border border-amber-500/50">
                      Editorial
                      <Badge className="bg-amber-300 text-amber-900 text-xs ml-1 font-semibold">Staff</Badge>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-80 p-3 bg-white shadow-xl rounded-lg border-t-4 border-amber-500">
                        {user.reviewer_status === 'active' && (
                          <Link to={createPageUrl("ReviewerDashboard")} className="block p-4 rounded-lg hover:bg-amber-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-amber-200">
                            Reviewer Dashboard
                          </Link>
                        )}
                        {(userRoles.includes('editor') || userRoles.includes('admin')) && (
                          <Link to={createPageUrl("EditorDashboard")} className="block p-4 rounded-lg hover:bg-amber-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-amber-200">
                            Editor Dashboard
                          </Link>
                        )}
                        {userRoles.includes('admin') && (
                          <Link to={createPageUrl("AdminDashboard")} className="block p-4 rounded-lg hover:bg-amber-50 text-slate-900 font-medium transition-colors border border-transparent hover:border-amber-200">
                            Admin Dashboard
                          </Link>
                        )}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </div>
    </header>
  );
}