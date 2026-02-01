import React, { useState, useEffect } from 'react';
import { Upazilla, ZillaPerson, PersonCategory } from '../types';
import * as DB from '../services/db';
import { Plus, Server, Trash2, Database, Key, Edit, Save, X, Map, Contact, Phone } from 'lucide-react';

const DEFAULT_MONGO_URL = "mongodb+srv://election_manager:7sHcm5XNdTLBKhy@cluster0.9fv57wd.mongodb.net/UNOs";

const SuperAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upazillas' | 'zilla_contacts'>('upazillas');
  const [upazillas, setUpazillas] = useState<Upazilla[]>([]);
  const [zillaPersons, setZillaPersons] = useState<ZillaPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);

  // Filter for Zilla Contacts
  const [selectedZillaFilter, setSelectedZillaFilter] = useState('All');
  
  const [formData, setFormData] = useState<Partial<Upazilla>>({
    name: '',
    zilla: 'বরগুনা',
    username: '',
    password: '',
    mongoDbUrl: DEFAULT_MONGO_URL,
    port: '3000',
    imgbbKey: ''
  });

  const [personForm, setPersonForm] = useState<Partial<ZillaPerson>>({
      zilla: 'বরগুনা',
      name: '',
      designation: '',
      phone: '',
      category: 'admin',
      ranking: 1
  });

  const fetchUpazillas = async () => {
    try {
        const data = await DB.getUpazillas();
        setUpazillas(data);
    } catch (error) {
        console.error("Failed to fetch upazillas", error);
    }
  };

  const fetchZillaPersons = async () => {
      try {
          const filter = selectedZillaFilter === 'All' ? undefined : selectedZillaFilter;
          const data = await DB.getZillaPersons(filter);
          setZillaPersons(data);
      } catch (error) {
          console.error("Failed to fetch zilla persons", error);
      }
  };

  useEffect(() => {
    if (activeTab === 'upazillas') fetchUpazillas();
    if (activeTab === 'zilla_contacts') fetchZillaPersons();
  }, [activeTab, selectedZillaFilter]);

  // --- Upazilla Handlers ---

  const handleEdit = (upazilla: Upazilla) => {
      setEditingId(upazilla.id);
      setFormData({
          name: upazilla.name,
          zilla: upazilla.zilla || 'বরগুনা',
          username: upazilla.username,
          password: upazilla.password,
          mongoDbUrl: upazilla.mongoDbUrl,
          port: upazilla.port,
          imgbbKey: upazilla.imgbbKey || ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      resetForm();
  };

  const resetForm = () => {
      setFormData({
          name: '',
          zilla: 'বরগুনা',
          username: '',
          password: '',
          mongoDbUrl: DEFAULT_MONGO_URL,
          port: '3000',
          imgbbKey: ''
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) return;

    setIsLoading(true);
    
    if (editingId) {
        // Update Existing
        const updatedUpazilla: Upazilla = {
            id: editingId,
            name: formData.name,
            zilla: formData.zilla || 'বরগুনা',
            username: formData.username,
            password: formData.password,
            mongoDbUrl: formData.mongoDbUrl || DEFAULT_MONGO_URL,
            port: formData.port || '3000',
            imgbbKey: formData.imgbbKey
        };
        await DB.updateUpazilla(updatedUpazilla);
        setEditingId(null);
    } else {
        // Create New
        const newUpazilla: Upazilla = {
            id: crypto.randomUUID(),
            name: formData.name,
            zilla: formData.zilla || 'বরগুনা',
            username: formData.username,
            password: formData.password,
            mongoDbUrl: formData.mongoDbUrl || DEFAULT_MONGO_URL,
            port: formData.port || '3000',
            imgbbKey: formData.imgbbKey
        };
        await DB.createUpazilla(newUpazilla);
    }

    resetForm();
    await fetchUpazillas();
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Are you sure? This will delete the Upazilla configuration.")) {
          await DB.deleteUpazilla(id);
          fetchUpazillas();
      }
  }

  // --- Zilla Person Handlers ---

  const handlePersonSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      const personData: ZillaPerson = {
          id: editingPersonId || crypto.randomUUID(),
          zilla: personForm.zilla || 'বরগুনা',
          name: personForm.name || '',
          designation: personForm.designation || '',
          phone: personForm.phone || '',
          category: (personForm.category as PersonCategory) || 'admin',
          ranking: Number(personForm.ranking) || 1
      };

      try {
        if (editingPersonId) {
            await DB.updateZillaPerson(personData);
        } else {
            await DB.createZillaPerson(personData);
        }
        setEditingPersonId(null);
        setPersonForm({ zilla: 'বরগুনা', name: '', designation: '', phone: '', category: 'admin', ranking: 1 });
        await fetchZillaPersons();
      } catch (err) {
          alert("Failed to save contact");
      }
      setIsLoading(false);
  };

  const handleEditPerson = (p: ZillaPerson) => {
      setEditingPersonId(p.id);
      setPersonForm({ ...p });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePerson = async (id: string) => {
      if(window.confirm("Delete this contact?")) {
          await DB.deleteZillaPerson(id);
          fetchZillaPersons();
      }
  };


  return (
    <div className="space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
            <button
                onClick={() => setActiveTab('upazillas')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'upazillas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Upazilla Management
            </button>
            <button
                onClick={() => setActiveTab('zilla_contacts')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'zilla_contacts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                District (Zilla) Contacts
            </button>
        </div>


      {activeTab === 'upazillas' && (
          <>
            {/* Create/Edit Section */}
            <section className={`bg-white rounded-xl shadow-sm border ${editingId ? 'border-amber-300 ring-1 ring-amber-300' : 'border-gray-200'} p-6 transition-all`}>
                <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${editingId ? 'text-amber-800' : 'text-gray-900'}`}>
                    {editingId ? <Edit className="w-5 h-5" /> : <Server className="w-5 h-5 text-blue-600" />}
                    {editingId ? 'Edit Upazilla Configuration' : 'Create New Upazilla Database'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                    {editingId ? 'Update administrative details and API keys.' : 'This will initialize a new administrative partition (MongoDB collection).'}
                    </p>
                </div>
                {editingId && (
                    <button onClick={handleCancelEdit} className="text-amber-700 hover:text-amber-900 flex items-center gap-1 text-sm font-medium">
                        <X className="w-4 h-4" /> Cancel Edit
                    </button>
                )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700">Zilla (District)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Map className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            required
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md border p-2"
                            placeholder="e.g. বরগুনা"
                            value={formData.zilla}
                            onChange={e => setFormData({ ...formData, zilla: e.target.value })}
                        />
                        </div>
                    </div>
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
                        type="text" 
                        required
                        autoComplete="off"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700">Database & API Configuration</h4>
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
                    <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase">ImgBB API Key (Optional)</label>
                    <div className="mt-1 flex items-center">
                        <Key className="w-4 h-4 text-slate-400 mr-2" />
                        <input
                            type="text"
                            className="block w-full rounded-md border-slate-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs font-mono border p-2"
                            placeholder="Leave empty to use default env key"
                            value={formData.imgbbKey}
                            onChange={e => setFormData({ ...formData, imgbbKey: e.target.value })}
                        />
                    </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                    <button
                    type="submit"
                    disabled={isLoading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors`}
                    >
                    {isLoading ? 'Processing...' : (
                        <>
                            {editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            {editingId ? 'Update Upazilla' : 'Create Upazilla'}
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
                    <li key={item.id} className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${editingId === item.id ? 'bg-amber-50' : ''}`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-bold">{item.name.substring(0, 1)}</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-blue-600">{item.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Map className="w-3 h-3" /> {item.zilla || 'বরগুনা'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">Admin: {item.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden lg:block text-right mr-4">
                                <p className="text-xs text-gray-400 font-mono max-w-[150px] truncate">{item.mongoDbUrl}</p>
                            </div>
                            <button 
                                onClick={() => handleEdit(item)}
                                className="text-amber-600 hover:text-amber-800 transition-colors p-2"
                                title="Edit Configuration"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
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
        </>
      )}

      {activeTab === 'zilla_contacts' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form Side */}
              <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                 <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    {editingPersonId ? <Edit className="w-5 h-5 text-amber-600"/> : <Plus className="w-5 h-5 text-blue-500" />} 
                    {editingPersonId ? 'Edit District Official' : 'Add District Official'}
                </h3>
                <form onSubmit={handlePersonSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">District (Zilla)</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={personForm.zilla}
                            onChange={e => setPersonForm({...personForm, zilla: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={personForm.name}
                            onChange={e => setPersonForm({...personForm, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Designation</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. DC, SP"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={personForm.designation}
                            onChange={e => setPersonForm({...personForm, designation: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={personForm.phone}
                            onChange={e => setPersonForm({...personForm, phone: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select 
                                value={personForm.category}
                                onChange={e => setPersonForm({...personForm, category: e.target.value as PersonCategory})}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            >
                                <option value="admin">Admin</option>
                                <option value="police">Police</option>
                                <option value="defence">Defence</option>
                                <option value="health">Health</option>
                                <option value="emergency">Emergency</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rank</label>
                            <input
                                type="number"
                                min="1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                value={personForm.ranking}
                                onChange={e => setPersonForm({...personForm, ranking: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>
                    
                    <div className="pt-2 flex gap-2">
                        {editingPersonId && (
                            <button
                                type="button"
                                onClick={() => { setEditingPersonId(null); setPersonForm({ zilla: 'বরগুনা', name: '', designation: '', phone: '', category: 'admin', ranking: 1 }) }}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${editingPersonId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
                        >
                            {isLoading ? 'Saving...' : (editingPersonId ? 'Update' : 'Add Contact')}
                        </button>
                    </div>
                </form>
              </div>

              {/* List Side */}
              <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                         <Contact className="w-5 h-5 text-gray-500"/> Official Directory
                      </h4>
                      <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Filter:</span>
                          <select 
                            value={selectedZillaFilter}
                            onChange={e => setSelectedZillaFilter(e.target.value)}
                            className="border border-gray-300 rounded text-sm p-1"
                          >
                              <option value="All">All Zillas</option>
                              {Array.from(new Set(upazillas.map(u => u.zilla))).map(z => (
                                  <option key={z} value={z || 'Unknown'}>{z || 'Unknown'}</option>
                              ))}
                          </select>
                      </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                 <tr>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                 </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                 {zillaPersons.map(person => (
                                     <tr key={person.id} className="hover:bg-gray-50">
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-500">
                                             {person.ranking}
                                         </td>
                                         <td className="px-6 py-4">
                                             <div className="flex flex-col">
                                                 <span className="font-bold text-gray-900">{person.name}</span>
                                                 <span className="text-sm text-gray-500">{person.designation}</span>
                                                 <span className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                                     <Map className="w-3 h-3"/> {person.zilla}
                                                 </span>
                                             </div>
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                             <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-gray-400"/> {person.phone}
                                             </div>
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <button 
                                                    onClick={() => handleEditPerson(person)}
                                                    className="text-amber-600 hover:text-amber-900"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeletePerson(person.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                         </td>
                                     </tr>
                                 ))}
                                 {zillaPersons.length === 0 && (
                                     <tr>
                                         <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">
                                             No contacts found for selected filter.
                                         </td>
                                     </tr>
                                 )}
                             </tbody>
                        </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SuperAdmin;