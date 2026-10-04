import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Auth = () => {
  const { login, register } = useAppContext();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || (mode === 'register' && !name)) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-600/50 text-gray-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow';

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#242124] to-[#000000] px-4">
      {/* Decorative glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900/70 backdrop-blur border border-purple-500/20 rounded-2xl shadow-2xl p-8">
          {/* Logo header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-16 h-16 flex items-center justify-center mb-4">
              <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 via-purple-500 to-indigo-500 rounded-full blur-md opacity-40 motion-safe:animate-[pulse_3s_ease-in-out_infinite]" />
              <div className="relative w-16 h-16 bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-1 shadow-xl border border-purple-500/30 overflow-hidden flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                  <defs>
                    <linearGradient id="auth-mask" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="auth-towel" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#E2E8F0" />
                    </linearGradient>
                    <linearGradient id="auth-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FED7AA" />
                      <stop offset="100%" stopColor="#FDBA74" />
                    </linearGradient>
                  </defs>
                  <path d="M35 75 Q50 82 65 75 L70 100 L30 100 Z" fill="#FDBA74" />
                  <path d="M25 82 Q50 95 75 82 L80 100 L20 100 Z" fill="url(#auth-towel)" />
                  <ellipse cx="50" cy="58" rx="18" ry="22" fill="url(#auth-skin)" />
                  <path d="M33 52 Q50 42 67 52 Q68 68 50 76 Q32 68 33 52 Z" fill="url(#auth-mask)" opacity="0.9" />
                  <path d="M40 56 Q44 60 47 56" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M53 56 Q56 60 60 56" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M45 68 Q50 72 55 68" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M30 45 Q50 35 70 45 Q75 35 65 25 Q50 15 35 25 Q25 35 30 45 Z" fill="url(#auth-towel)" />
                  <path d="M42 28 Q50 10 58 28 Q50 22 42 28 Z" fill="#F1F5F9" />
                </svg>
              </div>
            </div>
            <h1
              className="text-4xl text-white leading-tight"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              Skin Affairs
            </h1>
            <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase mt-1">
              Intelligent AI Assistant
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-slate-800/60 rounded-lg p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all capitalize ${
                  mode === m
                    ? 'bg-gradient-to-r from-[#A456F7] to-[#3D81F6] text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputClasses}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClasses}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={inputClasses}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#A456F7] to-[#3D81F6] shadow-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;