import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [formError, setFormError] = useState('');
  
  const { register, error, isLoading } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Form validation
    if (!username) {
      setFormError('Username is required');
      return;
    }
    
    if (!email) {
      setFormError('Email is required');
      return;
    }
    
    if (!password) {
      setFormError('Password is required');
      return;
    }
    
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== passwordConfirm) {
      setFormError('Passwords do not match');
      return;
    }
    
    try {
      await register(email, username, password);
      // Redirect to login after successful registration
      navigate('/login', { 
        state: { message: 'Registration successful! Please log in with your new account.' } 
      });
    } catch (err) {
      // Error is already handled in the store
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 relative overflow-hidden">
      {/* Tech background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute w-full h-full bg-grid-white/[0.05] bg-[length:50px_50px]"></div>
        <div className="absolute top-[-10%] left-[5%] w-[30%] h-[40%] rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[5%] w-[30%] h-[40%] rounded-full bg-indigo-500/10 blur-3xl"></div>
      </div>
      
      {/* Grid lines for tech effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full max-w-4xl max-h-[600px] border border-gray-700/40 rounded-lg grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)]">
          {Array.from({ length: 19 }).map((_, i) => (
            <div key={`h-${i}`} className="col-span-full h-px bg-gray-700/20" style={{ gridRow: i + 2 }}></div>
          ))}
          {Array.from({ length: 19 }).map((_, i) => (
            <div key={`v-${i}`} className="row-span-full w-px bg-gray-700/20" style={{ gridColumn: i + 2 }}></div>
          ))}
        </div>
      </div>
      
      <div className="max-w-md w-full space-y-8 bg-gray-900/70 backdrop-blur-md p-8 rounded-xl border border-gray-700/50 shadow-xl z-10 relative">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent pb-1">Husslify</h1>
          <h2 className="mt-6 text-2xl font-bold text-white">Create an account</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md text-white placeholder-gray-400 transition-all"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md text-white placeholder-gray-400 transition-all"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md text-white placeholder-gray-400 transition-all"
                placeholder="Create a password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md text-white placeholder-gray-400 transition-all"
                placeholder="Confirm your password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
          </div>
          
          {(formError || error) && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-3 rounded-md text-sm">
              {formError || error}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 flex justify-center items-center bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-md font-medium text-white shadow-lg shadow-indigo-600/20 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
      
      {/* Animated tech overlay elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '10s' }}></div>
        
        <div className="absolute top-20 right-[20%] w-8 h-8 border border-indigo-500/30 rounded-md"></div>
        <div className="absolute bottom-20 left-[20%] w-8 h-8 border border-blue-500/20 rounded-full"></div>
      </div>
    </div>
  );
}; 