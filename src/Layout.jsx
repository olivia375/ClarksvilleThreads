import React from "react";
import { useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Building2, Heart, User, Search, Briefcase, LogOut, LogIn, Menu, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/lib/FirebaseAuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import NotificationBadge from "./components/NotificationBadge";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, logout, signInWithGoogle } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { name: "Home", icon: Home, path: createPageUrl("Home") },
    { name: "Explore", icon: Search, path: createPageUrl("Explore") },
    { name: "Opportunities", icon: Briefcase, path: createPageUrl("Opportunities") },
    { name: "My Calendar", icon: CalendarIcon, path: createPageUrl("Calendar") },
    { name: "My Favorites", icon: Heart, path: createPageUrl("Favorites") },
    { name: "My Profile", icon: User, path: createPageUrl("Profile") },
  ];

  const businessNavItems = user?.is_business_owner ? [
    { name: "Business Dashboard", icon: Building2, path: createPageUrl("BusinessDashboard") }
  ] : [
    { name: "Business Signup", icon: Building2, path: createPageUrl("BusinessSignup") }
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  const NavLinks = ({ mobile = false }) => (
    <>
      {navItems.map((item) => (
        <a
          key={item.name}
          href={item.path}
          onClick={() => mobile && setIsOpen(false)}
          className={`flex items-center rounded-lg transition-all whitespace-nowrap ${
            mobile ? "gap-3 px-4 py-2.5" : "px-3 py-2 text-sm"
          } ${
            isActive(item.path)
              ? "bg-blue-50 text-blue-900 font-medium"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          {mobile && <item.icon className="w-5 h-5" />}
          <span>{item.name}</span>
        </a>
      ))}
      {mobile && <div className="border-t border-gray-200 my-2" />}
      {businessNavItems.map((item) => (
        <a
          key={item.name}
          href={item.path}
          onClick={() => mobile && setIsOpen(false)}
          className={`flex items-center rounded-lg transition-all whitespace-nowrap ${
            mobile ? "gap-3 px-4 py-2.5" : "px-3 py-2 text-sm"
          } ${
            isActive(item.path)
              ? "bg-blue-50 text-blue-900 font-medium"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          {mobile && <item.icon className="w-5 h-5" />}
          <span>{item.name}</span>
        </a>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        :root {
          --primary: 30 64 175;
          --primary-foreground: 255 255 255;
        }
      `}</style>

      {/* Desktop Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">CommunityConnect</h1>
                <p className="text-xs text-gray-500">Local Volunteer Platform</p>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLinks />
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="hidden lg:flex items-center gap-3">
                  <NotificationBadge user={user} />
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {user.total_hours_volunteered || 0}h volunteered
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={signInWithGoogle}
                  className="hidden lg:flex items-center gap-2 bg-blue-900 hover:bg-blue-800"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In with Google
                </Button>
              )}

              {/* Mobile Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">CommunityConnect</h2>
                        <p className="text-xs text-gray-500">Menu</p>
                      </div>
                    </div>

                    {user && (
                      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {user.total_hours_volunteered || 0}h volunteered
                        </p>
                      </div>
                    )}

                    <nav className="flex-1 flex flex-col gap-2">
                      <NavLinks mobile />
                    </nav>

                    {user ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-blue-900 hover:bg-blue-800"
                        onClick={() => {
                          signInWithGoogle();
                          setIsOpen(false);
                        }}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In with Google
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2025 CommunityConnect. Connecting volunteers with local businesses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}