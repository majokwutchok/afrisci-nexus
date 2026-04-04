import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Search, Upload, User as UserIcon, LogOut, LayoutDashboard,
  ShieldCheck, Eye, Edit, UserPlus, LogIn, Menu, X,
  BookOpen, FileText, ChevronDown, ChevronRight
} from "lucide-react";
import AfriSciLogo from "../brand/AfriSciLogo";
import {
  NavigationMenu, NavigationMenuContent,
  NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_SECTIONS = [
  {
    label: "About", color: "bg-blue-800/50 border-blue-600/30",
    links: [
      { title: "About Us", url: "About" },
      { title: "Editorial Board", url: "Editorial" },
      { title: "Open Access Policy", url: "OpenAccess" },
      { title: "Contact Us", url: "Contact" },
    ]
  },
  {
    label: "Browse", color: "bg-teal-600/60 border-teal-500/40", badge: "Popular",
    links: [
      { title: "All Journals", url: "Journals" },
      { title: "Latest Publications", url: "Publications" },
      { title: "Research Archive", url: "Archive" },
    ]
  },
  {
    label: "For Authors", color: "bg-emerald-600/60 border-emerald-500/40", badge: "Popular",
    links: [
      { title: "Submit Manuscript", url: "Submit" },
      { title: "Track Submission", url: "MyManuscripts" },
      { title: "Submission Guidelines", url: "Guidelines" },
      { title: "Author Resources", url: "AuthorResources" },
    ]
  },
  {
    label: "For Reviewers", color: "bg-blue-700/50 border-blue-600/30",
    links: [
      { title: "Apply as Reviewer", url: "Apply?role=reviewer" },
      { title: "Reviewer Dashboard", url: "ReviewerDashboard" },
      { title: "Review Guidelines", url: "ReviewGuidelines" },
      { title: "Reviewer Awards", url: "ReviewerAwards" },
    ]
  },
  {
    label: "For Editors", color: "bg-amber-600/70 border-amber-500/50",
    links: [
      { title: "Apply as Editor", url: "Apply?role=editor" },
      { title: "Editorial Board", url: "Editorial" },
      { title: "Editor Dashboard", url: "EditorDashboard" },
    ]
  },
];

function MobileNavSection({ section, onClose }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-white font-semibold text-sm"
      >
        <span className="flex items-center gap-2">
          {section.label}
          {section.badge && <Badge className="bg-teal-500 text-white text-xs">{section.badge}</Badge>}
        </span>
        {open ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
      </button>
      {open && (
        <div className="pb-2 pl-4 space-y-1">
          {section.links.map(link => (
            <Link
              key={link.title}
              to={link.url.includes('?') ? `/${link.url}` : createPageUrl(link.url)}
              onClick={onClose}
              className="block text-sky-200 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              {link.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomeHeader() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl("Search") + `?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSignOut = () => base44.auth.logout();
  const handleSignIn = () => base44.auth.redirectToLogin(createPageUrl('MyManuscripts'));

  const userRoles = ['user'];
  if (user) {
    if (user.role === 'admin') userRoles.push('admin');
    if (user.editor_roles?.length > 0) userRoles.push('editor');
  }

  const getDashboardLinks = () => {
    const links = [];
    if (userRoles.includes('admin')) links.push({ label: 'Admin', url: createPageUrl('AdminDashboard'), icon: ShieldCheck });
    if (userRoles.includes('editor')) links.push({ label: 'Editor', url: createPageUrl('EditorDashboard'), icon: Edit });
    if (user?.reviewer_status === 'active') links.push({ label: 'Reviewer', url: createPageUrl('ReviewerDashboard'), icon: Eye });
    links.push({ label: 'My Papers', url: createPageUrl('MyManuscripts'), icon: LayoutDashboard });
    return links;
  };

  return (
    <header className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 text-white shadow-xl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #14B8A6 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #38BDF8 0%, transparent 50%)`
        }} />
      </div>

      <div className="relative">
        {/* ── TOP BAR ── */}
        <div className="border-b border-blue-700/50 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

            {/* MOBILE top bar: avatar / sign-in + hamburger */}
            <div className="flex lg:hidden items-center justify-between h-12">
              {user ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-teal-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold truncate max-w-[110px]">{user.full_name}</span>
                  {user.role === 'admin' && <Badge className="bg-red-500 text-white text-xs px-1">Admin</Badge>}
                  {user.editor_roles?.length > 0 && <Badge className="bg-sky-400 text-white text-xs px-1">Editor</Badge>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleSignIn} className="flex items-center gap-1 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20">
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </button>
                  <button onClick={handleSignIn} className="flex items-center gap-1 bg-teal-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg">
                    <UserPlus className="w-3.5 h-3.5" /> Sign Up
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                {user && (
                  <button onClick={handleSignOut} className="flex items-center gap-1 text-red-300 text-xs px-2 py-1.5 rounded-lg hover:bg-red-500/20 border border-red-400/20">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setSearchOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-white/10 text-sky-200">
                  <Search className="w-4 h-4" />
                </button>
                <button onClick={() => setMobileOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-white/10 text-white">
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* DESKTOP top bar */}
            <div className="hidden lg:flex items-center justify-between h-12 text-sm">
              <div className="flex items-center space-x-6">
                <span className="text-sky-200">🌍 Serving 54 African Countries</span>
                <span className="text-sky-200">📊 10,000+ Published Articles</span>
              </div>
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                      <div className="w-6 h-6 bg-teal-400 rounded-full flex items-center justify-center">
                        <UserIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white text-sm font-semibold max-w-[140px] truncate">{user.full_name}</span>
                      {user.role === 'admin' && <Badge className="bg-red-500 text-white text-xs">Admin</Badge>}
                      {user.editor_roles?.length > 0 && <Badge className="bg-sky-400 text-white text-xs">Editor</Badge>}
                    </div>
                    {getDashboardLinks().map(({ label, url, icon: Icon }) => (
                      <Link key={label} to={url}
                        className="flex items-center gap-1.5 text-teal-200 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors border border-white/10 hover:border-white/30">
                        <Icon className="w-3 h-3" />{label}
                      </Link>
                    ))}
                    <button onClick={handleSignOut}
                      className="flex items-center gap-1.5 text-red-300 hover:text-red-200 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors border border-red-400/20">
                      <LogOut className="w-3 h-3" /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleSignIn} className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors border border-white/20">
                      <LogIn className="w-4 h-4" /> Sign In
                    </button>
                    <button onClick={handleSignIn} className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-4 py-1.5 rounded-lg shadow transition-colors">
                      <UserPlus className="w-4 h-4" /> Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile search bar (expandable) */}
        {searchOpen && (
          <div className="lg:hidden bg-blue-950/80 backdrop-blur px-3 py-2 border-b border-white/10">
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 border border-white/20">
              <Search className="w-4 h-4 text-sky-200 flex-shrink-0" />
              <input
                type="text" autoFocus value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search journals, articles..."
                className="bg-transparent text-white placeholder-sky-300 border-none outline-none text-sm flex-1"
              />
            </form>
          </div>
        )}

        {/* ── MAIN HEADER: Logo + actions ── */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4 lg:py-6">
              <Link to={createPageUrl("Home")}>
                <AfriSciLogo variant="header" theme="dark" />
              </Link>

              {/* Desktop: search + submit */}
              <div className="hidden lg:flex items-center gap-4">
                <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  <Search className="w-4 h-4 text-sky-200" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search journals, articles..."
                    className="bg-transparent text-white placeholder-sky-300 border-none outline-none text-sm w-64" />
                </form>
                <Link to={createPageUrl("Submit")}>
                  <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <Upload className="w-4 h-4 mr-2" /> Submit Article
                  </Button>
                </Link>
              </div>

              {/* Mobile: submit button */}
              <div className="lg:hidden">
                <Link to={createPageUrl("Submit")}>
                  <Button size="sm" className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-4 rounded-xl shadow">
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Submit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── DESKTOP NAV ── */}
        <div className="hidden lg:block relative z-20 bg-white/5 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <NavigationMenu>
              <NavigationMenuList className="flex items-center space-x-1 py-3 flex-wrap gap-y-1">
                <NavigationMenuItem>
                  <Link to={createPageUrl("Home")} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors font-medium text-sm">
                    Home
                  </Link>
                </NavigationMenuItem>

                {NAV_SECTIONS.map(section => (
                  <NavigationMenuItem key={section.label}>
                    <NavigationMenuTrigger className={`flex items-center gap-2 text-white hover:text-white font-medium px-3 py-2 rounded-lg transition-colors border text-sm ${section.color}`}>
                      {section.label}
                      {section.badge && <Badge className="bg-teal-400 text-teal-900 text-xs ml-1">{section.badge}</Badge>}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-72 p-3 bg-white shadow-xl rounded-lg border-t-4 border-teal-500">
                        {section.links.map(link => (
                          <Link key={link.title}
                            to={link.url.includes('?') ? `/${link.url}` : createPageUrl(link.url)}
                            className="block p-3 rounded-lg hover:bg-slate-50 text-slate-800 font-medium text-sm transition-colors border border-transparent hover:border-slate-200">
                            {link.title}
                          </Link>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* ── MOBILE MENU DRAWER ── */}
        {mobileOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 z-50 bg-blue-950/97 backdrop-blur-md shadow-2xl border-t border-white/10 max-h-[80vh] overflow-y-auto">
            {/* Dashboard quick links for logged-in users */}
            {user && (
              <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                <p className="text-xs text-sky-400 font-semibold uppercase tracking-wide mb-2">My Dashboards</p>
                <div className="flex flex-wrap gap-2">
                  {getDashboardLinks().map(({ label, url, icon: Icon }) => (
                    <Link key={label} to={url} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-1.5 text-teal-200 text-xs font-medium px-3 py-2 rounded-lg bg-white/10 border border-white/15">
                      <Icon className="w-3.5 h-3.5" />{label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Nav sections */}
            <div className="py-1">
              <Link to={createPageUrl("Home")} onClick={() => setMobileOpen(false)}
                className="flex items-center px-4 py-3 text-white font-semibold text-sm border-b border-white/10 hover:bg-white/10">
                🏠 Home
              </Link>
              {NAV_SECTIONS.map(section => (
                <MobileNavSection key={section.label} section={section} onClose={() => setMobileOpen(false)} />
              ))}
            </div>

            {/* Bottom actions */}
            <div className="px-4 py-4 border-t border-white/10 bg-black/20">
              <Link to={createPageUrl("Submit")} onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl">
                  <Upload className="w-4 h-4 mr-2" /> Submit Article
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}