import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b ${
      isActive
        ? 'text-[#166534] border-[#166534]'
        : 'text-[#4A584E] border-transparent hover:text-[#1A241E] hover:border-[#C5D1C1]'
    }`;

  const portalPath = user?.role === 'admin' ? '/admin' : user ? '/dashboard' : '/login';
  const portalLabel = user?.role === 'admin' ? 'Admin Console' : user ? 'My Account' : 'Sign In';

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#FAFBF8]/95 backdrop-blur-sm border-b border-[#DDE4DA]">
      <div className="max-w-[1280px] mx-auto h-full px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <Link
          to="/"
          className="font-display text-xl font-semibold tracking-tight text-[#1A241E] whitespace-nowrap shrink-0"
        >
          Verdant Bowl
        </Link>

        {/* Zone 2: 4-5 Concise Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          <NavLink to="/menu" className={navLinkClass}>
            Menu
          </NavLink>
          <NavLink to="/builder" className={navLinkClass}>
            Salad Builder
          </NavLink>
          <NavLink to="/plans" className={navLinkClass}>
            Plans
          </NavLink>
          <NavLink to="/appointments" className={navLinkClass}>
            Appointments
          </NavLink>
          <NavLink to="/cart" className={navLinkClass}>
            Cart ({totalItems})
          </NavLink>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="hidden md:flex items-center shrink-0">
          <button
            type="button"
            onClick={() => navigate(portalPath)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#166534] hover:bg-[#14532D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#166534]"
          >
            {portalLabel}
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 text-[#1A241E] rounded-lg hover:bg-[#EDF2EA]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#FAFBF8] border-b border-[#DDE4DA] px-6 py-4 space-y-3">
          <div className="flex flex-col gap-3">
            <Link
              to="/menu"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#1A241E] py-1.5"
            >
              Menu
            </Link>
            <Link
              to="/builder"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#1A241E] py-1.5"
            >
              Salad Builder
            </Link>
            <Link
              to="/plans"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#1A241E] py-1.5"
            >
              Plans
            </Link>
            <Link
              to="/appointments"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#1A241E] py-1.5"
            >
              Appointments
            </Link>
            <Link
              to="/cart"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-[#1A241E] py-1.5"
            >
              Cart ({totalItems})
            </Link>
            {user && (
              <Link
                to={user.role === 'admin' ? '/admin' : '/orders'}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-[#1A241E] py-1.5"
              >
                {user.role === 'admin' ? 'Operations' : 'My Orders'}
              </Link>
            )}
          </div>
          <div className="pt-2 border-t border-[#DDE4DA]">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate(portalPath);
              }}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#166534] rounded-lg"
            >
              {portalLabel}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
