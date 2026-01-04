import React, { useState } from 'react';
import { UserRole, UserSession } from './types';
import * as DB from './services/db';
import Layout from './components/Layout';
import SuperAdmin from './components/SuperAdmin';
import UpazillaAdmin from './components/UpazillaAdmin';
import { Shield, User } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.UPAZILLA_ADMIN);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        // Super Admin Hardcoded Check
        if (role === UserRole.SUPER_ADMIN) {
            if (username === 'admin' && password === 'admin') {
                setSession({ role: UserRole.SUPER_ADMIN, username: 'Super Admin' });
            } else {
                setError('Invalid Super Admin credentials (try admin/admin)');
            }
            setLoading(false);
            return;
        }

        // Upazilla Admin Check via Backend
        const upazillas = await DB.getUpazillas();
        const target = upazillas.find(u => u.username === username && u.password === password);
        
        if (target) {
            setSession({
                role: UserRole.UPAZILLA_ADMIN,
                username: target.name,
                upazillaId: target.id
            });
        } else {
            setError('Invalid Upazilla Admin credentials');
        }
    } catch (err) {
        setError('Connection to backend failed. Is the server running?');
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
      setSession(null);
      setUsername('');
      setPassword('');
      setError('');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center">
                <Shield className="w-12 h-12 text-blue-600" />
            </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ElectionManager Pro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure Election Administration Portal
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <div className="mt-1 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setRole(UserRole.UPAZILLA_ADMIN)}
                        className={`flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none ${role === UserRole.UPAZILLA_ADMIN ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Upazilla Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole(UserRole.SUPER_ADMIN)}
                        className={`flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none ${role === UserRole.SUPER_ADMIN ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Super User
                    </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                      {error}
                  </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Sign in'}
                </button>
              </div>
            </form>
            <div className="mt-4 text-xs text-center text-gray-400">
                Default Super User: admin / admin
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
        session={session} 
        onLogout={handleLogout}
        title={session.role === UserRole.SUPER_ADMIN ? "System Administration" : "Upazilla Management"}
    >
        {session.role === UserRole.SUPER_ADMIN ? (
            <SuperAdmin />
        ) : (
            <UpazillaAdmin upazillaId={session.upazillaId!} />
        )}
    </Layout>
  );
};

export default App;