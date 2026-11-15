import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginRegisterPage({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const redirectPath =
    searchParams.get('redirect') ||
    (location.state as { from?: string } | null)?.from ||
    null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const loggedUser = await login(email, password);
        if (redirectPath) {
          navigate(redirectPath, { replace: true });
        } else {
          navigate(loggedUser.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        }
      } else {
        if (name.trim().length < 2) {
          setError('Full name must be at least 2 characters.');
          setSubmitting(false);
          return;
        }
        if (phone.trim().length < 8) {
          setError('Please enter a valid phone number.');
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        await register({ name, email, phone, address, password });
        navigate(redirectPath || '/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Authentication failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: 'member' | 'admin') => {
    setMode('login');
    setError('');
    if (role === 'admin') {
      setEmail('admin@verdantbowl.com');
      setPassword('Admin@123');
    } else {
      setEmail('ananya@verdantbowl.com');
      setPassword('Member@123');
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="bg-white border border-[#DDE4DA] rounded-xl p-6 sm:p-8">
        <div className="flex items-center gap-1 p-1 bg-[#EFF3EC] rounded-lg mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-white text-[#1A241E] shadow-sm' : 'text-[#526056]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-white text-[#1A241E] shadow-sm' : 'text-[#526056]'
            }`}
          >
            Create Account
          </button>
        </div>

        <h1 className="font-display text-2xl font-semibold text-[#1A241E]">
          {mode === 'login' ? 'Welcome back' : 'Join Verdant Bowl'}
        </h1>
        <p className="text-sm text-[#526056] mt-1">
          {mode === 'login'
            ? 'Access your meal plan, custom bowls, and order history.'
            : 'Create your member profile to start ordering or subscribing.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ananya Sharma"
                  className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#35473B] mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Apartment, Street, City"
                  className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-[#35473B] mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#35473B] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
            />
          </div>

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Member Account'}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-6 pt-5 border-t border-[#E8EDE5]">
          <p className="text-xs text-[#647469] mb-2.5">Demo Quick-Fill Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('member')}
              className="py-2 px-3 text-xs font-medium bg-[#F4F7F2] hover:bg-[#E7ECE4] text-[#1A241E] rounded-lg cursor-pointer"
            >
              Member Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="py-2 px-3 text-xs font-medium bg-[#F4F7F2] hover:bg-[#E7ECE4] text-[#1A241E] rounded-lg cursor-pointer"
            >
              Admin Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
