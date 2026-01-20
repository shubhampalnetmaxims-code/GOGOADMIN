
import React, { useState } from 'react';
import { Car, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@gogo.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication delay for realism
    setTimeout(() => {
      onLogin();
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-gray-50 to-white relative overflow-hidden">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <div className="text-5xl font-black text-blue-600 tracking-tighter flex items-center">
            <span>G</span>
            <span className="text-yellow-500 mx-1 relative top-1.5">
               <Car size={40} fill="currentColor" strokeWidth={0} />
            </span>
            <span>go</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[48px] shadow-2xl shadow-blue-900/10 border border-white/60 p-12 backdrop-blur-sm">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Fleet Access</h1>
            <p className="text-sm text-gray-500 font-medium">Enter credentials to authenticate your session.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <Mail className="absolute left-4 top-[48px] text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" size={18} />
              <Input 
                label="Registry Email" 
                type="email" 
                className="pl-12 h-14" 
                placeholder="admin@gogo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-[48px] text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" size={18} />
              <Input 
                label="Security Key" 
                type="password" 
                className="pl-12 h-14" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-4">
              <Button 
                variant="black" 
                fullWidth 
                type="submit" 
                className="h-16 rounded-[24px] text-base font-black uppercase tracking-widest shadow-2xl shadow-gray-200 transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Establish Connection
                    <ArrowRight size={20} className="ml-1" />
                  </div>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Service Status: Normal
            </div>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-blue-500"/> AES-256 Verified</span>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-gray-400 font-medium">
          Authorized personnel only. <a href="#" className="text-blue-600 hover:underline font-bold">Policy & Protocols</a>
        </p>
      </div>
    </div>
  );
};
