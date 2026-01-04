import React, { useState, useEffect } from 'react';
import { Upazilla } from '../types';
import * as DB from '../services/db';
import { Plus, Server, Trash2, Database } from 'lucide-react';

const DEFAULT_MONGO_URL = "mongodb+srv://election_manager:7sHcm5XNdTLBKhy@cluster0.9fv57wd.mongodb.net/UNOs";

const SuperAdmin: React.FC = () => {
  const [upazillas, setUpazillas] = useState<Upazilla[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Upazilla>>({
    name: '',
    username: '',
    password: '',
    mongoDbUrl: DEFAULT_MONGO_URL,
    port: '3000'
  });

  const fetchUpazillas = async () => {
    try {
        const data = await DB.getUpazillas();
        setUpazillas(data);
    } catch (error) {
        console.error("Failed to fetch upazillas", error);
    }
  };

  useEffect(() => {
    fetchUpazillas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) return;

    setIsLoading(true);
    const newUpazilla: Upazilla = {
      id: crypto.randomUUID(),
      name: formData.name,
      username: formData.username,
      password: formData.password,
      mongoDbUrl: formData.mongoDbUrl || DEFAULT_MONGO_URL,
      port: formData.port || '3000'
    };

    await DB.createUpazilla(newUpazilla);
    setFormData({ ...formData, name: '', username: '', password: '' });
    await fetchUpazillas();
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Are you sure? This will delete the Upazilla configuration.")) {
          await DB.deleteUpazilla(id);
          fetchUpazillas();
      }
  }

  return (
    <div className="space-y-8">
      {/* Create Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Create New Upazilla Database
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            This will initialize a new administrative partition (MongoDB collection).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Upazilla Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="e.g. Sadar Upazilla"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Username</label>
              <input
                type="text"
                required
                autoComplete="off"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700">Database Configuration</h4>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase">MongoDB Connection String</label>
              <div className="mt-1 flex items-center">
                  <Database className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    required
                    className="block w-full rounded-md border-slate-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-mono border p-2"
                    value={formData.mongoDbUrl}
                    onChange={e => setFormData({ ...formData, mongoDbUrl: e.target.value })}
                  />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase">Port</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-slate-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-mono border p-2"
                value={formData.port}
                onChange={e => setFormData({ ...formData, port: e.target.value })}
              />
            </div>
            <div className="text-xs text-slate-500 italic">
                Connection established on first access
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Upazilla
                  </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* List Section */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Manage Upazillas</h3>
        <div className="bg-white shadow overflow-hidden rounded-md border border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {upazillas.length === 0 && (
                <li className="p-6 text-center text-gray-500 italic">No upazillas configured yet.</li>
            )}
            {upazillas.map((item) => (
              <li key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-bold">{item.name.substring(0, 1)}</span>
                    </div>
                    <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">{item.name}</p>
                        <p className="text-xs text-gray-500">Admin: {item.username} | Port: {item.port}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                        <p className="text-xs text-gray-400 font-mono max-w-[150px] truncate">{item.mongoDbUrl}</p>
                    </div>
                    <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Delete Upazilla"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default SuperAdmin;