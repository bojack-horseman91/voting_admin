import React, { useState, useEffect } from 'react';
import { Union, VotingCenter } from '../types';
import * as DB from '../services/db';
import * as AI from '../services/ai';
import { Plus, MapPin, Users, Upload, ExternalLink, ShieldCheck, FileText, BrainCircuit, Edit2, CheckCircle2, X, List } from 'lucide-react';

interface Props {
  upazillaId: string;
}

const UpazillaAdmin: React.FC<Props> = ({ upazillaId }) => {
  const [activeTab, setActiveTab] = useState<'unions' | 'centers'>('unions');
  const [unions, setUnions] = useState<Union[]>([]);
  const [centers, setCenters] = useState<VotingCenter[]>([]); // Note: These are now "lite" objects
  const [selectedUnionId, setSelectedUnionId] = useState<string>('');
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form States
  const [newUnionName, setNewUnionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Center Form State
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
  
  // Separate state for file handling to upload only on save
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  const [centerForm, setCenterForm] = useState<Partial<VotingCenter>>({
    presidingOfficer: { name: '', position: 'Presiding Officer', phone: '' },
    assistantPresidingOfficer: { name: '', position: 'Asst. Presiding Officer', phone: '' },
    policeOfficer: { name: '', position: 'Police Officer', phone: '' },
    googleMapLink: '',
    imageUrl: ''
  });
  
  const [uploadingImg, setUploadingImg] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchData = async () => {
    try {
        const u = await DB.getUnions(upazillaId);
        setUnions(u);
        
        let unionToFetch = selectedUnionId;
        
        if (!unionToFetch && u.length > 0) {
            unionToFetch = u[0].id;
            setSelectedUnionId(unionToFetch);
        }

        if (unionToFetch) {
            const c = await DB.getCenters(unionToFetch, upazillaId);
            setCenters(c);
        } else {
            setCenters([]);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upazillaId, selectedUnionId]);

  useEffect(() => {
    if(successMsg) {
        const timer = setTimeout(() => setSuccessMsg(''), 3000);
        return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Clean up object URL to avoid memory leaks
  useEffect(() => {
      return () => {
          if (imagePreviewUrl && !imagePreviewUrl.startsWith('http')) {
              URL.revokeObjectURL(imagePreviewUrl);
          }
      };
  }, [imagePreviewUrl]);

  const handleCreateUnion = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newUnionName) return;
    setIsSubmitting(true);
    await DB.createUnion({
        id: crypto.randomUUID(),
        upazillaId,
        name: newUnionName
    });
    setNewUnionName('');
    setSuccessMsg('Union created successfully in database!');
    setIsSubmitting(false);
    fetchData();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedImageFile(file);
          // Create local preview
          const objectUrl = URL.createObjectURL(file);
          setImagePreviewUrl(objectUrl);
      }
  };

  const handleEditCenter = async (liteCenter: VotingCenter) => {
      try {
          setLoadingDetails(true);
          // Fetch full details
          const fullCenter = await DB.getCenterDetails(liteCenter.id, upazillaId);
          setEditingCenterId(fullCenter.id);
          setCenterForm({ ...fullCenter });
          setImagePreviewUrl(fullCenter.imageUrl || '');
          setSelectedImageFile(null); 
          window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
          alert("Failed to load center details");
      } finally {
          setLoadingDetails(false);
      }
  };

  const handleCancelEdit = () => {
      setEditingCenterId(null);
      resetCenterForm();
  };

  const resetCenterForm = () => {
      setCenterForm({
        presidingOfficer: { name: '', position: 'Presiding Officer', phone: '' },
        assistantPresidingOfficer: { name: '', position: 'Asst. Presiding Officer', phone: '' },
        policeOfficer: { name: '', position: 'Police Officer', phone: '' },
        imageUrl: '',
        name: '',
        location: '',
        googleMapLink: ''
      });
      setSelectedImageFile(null);
      setImagePreviewUrl('');
  };

  const handleSaveCenter = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUnionId || !centerForm.name) return;
      setIsSubmitting(true);
      
      let finalImageUrl = centerForm.imageUrl;

      // Handle Image Upload to ImgBB if a new file is selected
      if (selectedImageFile) {
          try {
              setUploadingImg(true);
              finalImageUrl = await DB.uploadImageToImgBB(selectedImageFile);
              setUploadingImg(false);
          } catch (error) {
              console.error(error);
              alert("Failed to upload image to ImgBB. Please check your API Key.");
              setUploadingImg(false);
              setIsSubmitting(false);
              return;
          }
      }
      
      const centerData: VotingCenter = {
          id: editingCenterId || crypto.randomUUID(),
          unionId: selectedUnionId,
          name: centerForm.name!,
          location: centerForm.location || '',
          googleMapLink: centerForm.googleMapLink || '',
          imageUrl: finalImageUrl,
          presidingOfficer: centerForm.presidingOfficer as any,
          assistantPresidingOfficer: centerForm.assistantPresidingOfficer as any,
          policeOfficer: centerForm.policeOfficer as any,
      };

      try {
        if (editingCenterId) {
            await DB.updateCenter(centerData, upazillaId);
            setSuccessMsg('Voting center updated successfully!');
        } else {
            await DB.createCenter(centerData, upazillaId);
            setSuccessMsg('Voting center added successfully!');
        }

        setEditingCenterId(null);
        resetCenterForm();
        fetchData();
      } catch (err) {
          alert("Failed to save data.");
      }
      
      setIsSubmitting(false);
  };

  const runAiAnalysis = async () => {
      setIsAnalyzing(true);
      let totalCenters = 0;
      for (const u of unions) {
          const c = await DB.getCenters(u.id, upazillaId);
          totalCenters += c.length;
      }
      const result = await AI.analyzeUpazillaStats(unions.length, totalCenters);
      setAiAnalysis(result);
      setIsAnalyzing(false);
  }

  const generateSecurityBrief = async (liteCenter: VotingCenter) => {
      try {
          // AI needs full details (Officer names etc)
          const fullCenter = await DB.getCenterDetails(liteCenter.id, upazillaId);
          const plan = await AI.generateSecurityPlan(fullCenter);
          alert(`Security Plan Generated by Gemini AI:\n\n${plan}`);
      } catch (e) {
          alert("Could not fetch details for AI analysis.");
      }
  }

  return (
    <div className="space-y-6">
        {/* Success Message Banner */}
        {successMsg && (
            <div className="fixed top-4 right-4 z-50 animate-bounce">
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center shadow-lg">
                    <CheckCircle2 className="w-5 h-5 mr-2"/>
                    <span className="block sm:inline">{successMsg}</span>
                </div>
            </div>
        )}

        {/* Loading Overlay */}
        {loadingDetails && (
            <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
                <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
                    <span className="text-blue-600 font-medium animate-pulse">Loading Details...</span>
                </div>
            </div>
        )}

        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('unions')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'unions' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    Manage Unions
                </button>
                <button
                    onClick={() => setActiveTab('centers')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'centers' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    Voting Centers
                </button>
            </div>
            {unions.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Current Union:</span>
                    <select 
                        value={selectedUnionId}
                        onChange={(e) => { setSelectedUnionId(e.target.value); setEditingCenterId(null); resetCenterForm(); }}
                        className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    >
                        {unions.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
            )}
        </div>

        {/* --- UNIONS TAB --- */}
        {activeTab === 'unions' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-500" /> Add Union
                    </h3>
                    <form onSubmit={handleCreateUnion} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Union Name</label>
                            <input
                                type="text"
                                value={newUnionName}
                                onChange={e => setNewUnionName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                placeholder="e.g. Char Union"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Create Union'}
                        </button>
                    </form>
                    
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <button 
                            onClick={runAiAnalysis}
                            className="w-full flex items-center justify-center gap-2 text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            <BrainCircuit className="w-4 h-4" /> 
                            {isAnalyzing ? 'Thinking...' : 'AI Admin Analysis'}
                        </button>
                        {aiAnalysis && (
                            <div className="mt-4 p-3 bg-purple-50 rounded text-xs text-purple-800 border border-purple-100">
                                {aiAnalysis}
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                     {unions.map(union => (
                         <div key={union.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                             <div>
                                 <h4 className="font-bold text-gray-800">{union.name}</h4>
                                 <p className="text-sm text-gray-500">Managed via Backend</p>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => { setSelectedUnionId(union.id); setActiveTab('centers'); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                     Manage Centers &rarr;
                                 </button>
                             </div>
                         </div>
                     ))}
                     {unions.length === 0 && (
                         <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                             No unions found. Create one to get started.
                         </div>
                     )}
                </div>
            </div>
        )}

        {/* --- CENTERS TAB --- */}
        {activeTab === 'centers' && (
            <div className="space-y-8">
                {unions.length === 0 ? (
                     <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
                         Please create a Union first before adding voting centers.
                     </div>
                ) : (
                    <>
                        {/* Center Creation/Edit Form */}
                        <div className={`bg-white rounded-lg shadow-sm border ${editingCenterId ? 'border-amber-300 ring-1 ring-amber-300' : 'border-gray-200'} overflow-hidden transition-all duration-300`}>
                            <div className={`px-6 py-4 border-b ${editingCenterId ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'} flex justify-between items-center`}>
                                <h3 className={`font-bold ${editingCenterId ? 'text-amber-800' : 'text-gray-800'}`}>
                                    {editingCenterId ? `Editing: ${centerForm.name}` : `Add Voting Location to ${unions.find(u => u.id === selectedUnionId)?.name}`}
                                </h3>
                                {editingCenterId && (
                                    <button onClick={handleCancelEdit} className="text-amber-800 hover:text-amber-900 flex items-center gap-1 text-sm font-medium">
                                        <X className="w-4 h-4" /> Cancel Edit
                                    </button>
                                )}
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleSaveCenter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Location Info */}
                                    <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-100">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Center Name</label>
                                            <input required type="text" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" 
                                                value={centerForm.name} onChange={e => setCenterForm({...centerForm, name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Location Address</label>
                                            <input required type="text" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" 
                                                value={centerForm.location} onChange={e => setCenterForm({...centerForm, location: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Google Map Link</label>
                                            <div className="flex rounded-md shadow-sm">
                                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                                    <MapPin className="w-4 h-4" />
                                                </span>
                                                <input type="text" className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" 
                                                    placeholder="https://maps.google.com/..."
                                                    value={centerForm.googleMapLink} onChange={e => setCenterForm({...centerForm, googleMapLink: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Officers */}
                                    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                                        <h4 className="font-semibold text-blue-900 text-sm flex items-center gap-2"><Users className="w-4 h-4"/> Presiding Officer</h4>
                                        <input placeholder="Name" className="block w-full rounded border-gray-300 text-sm p-2" 
                                            value={centerForm.presidingOfficer?.name} onChange={e => setCenterForm({...centerForm, presidingOfficer: {...centerForm.presidingOfficer!, name: e.target.value}})} />
                                        <input placeholder="Position (e.g. Presiding Officer)" className="block w-full rounded border-gray-300 text-sm p-2" 
                                            value={centerForm.presidingOfficer?.position} onChange={e => setCenterForm({...centerForm, presidingOfficer: {...centerForm.presidingOfficer!, position: e.target.value}})} />
                                        <input placeholder="Phone" className="block w-full rounded border-gray-300 text-sm p-2" 
                                            value={centerForm.presidingOfficer?.phone} onChange={e => setCenterForm({...centerForm, presidingOfficer: {...centerForm.presidingOfficer!, phone: e.target.value}})} />
                                    </div>
                                    
                                    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                                        <h4 className="font-semibold text-blue-900 text-sm flex items-center gap-2"><Users className="w-4 h-4"/> Asst. Presiding Officer</h4>
                                        <input placeholder="Name" className="block w-full rounded border-gray-300 text-sm p-2" 
                                            value={centerForm.assistantPresidingOfficer?.name} onChange={e => setCenterForm({...centerForm, assistantPresidingOfficer: {...centerForm.assistantPresidingOfficer!, name: e.target.value}})} />
                                        <input placeholder="Position (e.g. Asst. PO)" className="block w-full rounded border-gray-300 text-sm p-2" 
                                            value={centerForm.assistantPresidingOfficer?.position} onChange={e => setCenterForm({...centerForm, assistantPresidingOfficer: {...centerForm.assistantPresidingOfficer!, position: e.target.value}})} />
                                        <input placeholder="Phone" className="block w-full rounded border-gray-300 text-sm p-2" 
                                            value={centerForm.assistantPresidingOfficer?.phone} onChange={e => setCenterForm({...centerForm, assistantPresidingOfficer: {...centerForm.assistantPresidingOfficer!, phone: e.target.value}})} />
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                                        <h4 className="font-semibold text-blue-900 text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Police Officer</h4>
                                        <input placeholder="Name" className="block w-full rounded border-gray-300 text-sm p-2" 
                                            value={centerForm.policeOfficer?.name} onChange={e => setCenterForm({...centerForm, policeOfficer: {...centerForm.policeOfficer!, name: e.target.value}})} />
                                        <input placeholder="Position (e.g. Constable)" className="block w-full rounded border-gray-300 text-sm p-2" 
                                            value={centerForm.policeOfficer?.position} onChange={e => setCenterForm({...centerForm, policeOfficer: {...centerForm.policeOfficer!, position: e.target.value}})} />
                                        <input placeholder="Phone" className="block w-full rounded border-gray-300 text-sm p-2" 
                                            value={centerForm.policeOfficer?.phone} onChange={e => setCenterForm({...centerForm, policeOfficer: {...centerForm.policeOfficer!, phone: e.target.value}})} />
                                    </div>

                                    {/* Image Upload */}
                                    <div className="md:col-span-2 lg:col-span-3 pt-4 border-t border-gray-100">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Center Image</label>
                                        <div className="flex items-center gap-4">
                                            <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                                <div className="flex items-center gap-2">
                                                    <Upload className="w-4 h-4" />
                                                    <span>{selectedImageFile ? 'Change Image' : 'Upload Image'}</span>
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                                            </label>
                                            
                                            {imagePreviewUrl && (
                                                <div className="flex items-center gap-2">
                                                    <img src={imagePreviewUrl} alt="Preview" className="h-10 w-10 object-cover rounded border border-gray-300" />
                                                    <span className="text-sm text-green-600 flex items-center gap-1">
                                                        <FileText className="w-4 h-4"/> {selectedImageFile ? 'Ready to upload' : 'Attached'}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {uploadingImg && <span className="text-xs text-blue-600 animate-pulse">Uploading to Cloud...</span>}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-4 gap-3">
                                        {editingCenterId && (
                                            <button type="button" onClick={handleCancelEdit} className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                                                Cancel
                                            </button>
                                        )}
                                        <button disabled={isSubmitting || uploadingImg} type="submit" className={`${editingCenterId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-md font-medium shadow-sm transition-colors disabled:opacity-50`}>
                                            {isSubmitting || uploadingImg ? 'Saving...' : (editingCenterId ? 'Update Location' : 'Add Location')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List Centers (Optimized Table) */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Center Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {centers.map(center => (
                                        <tr key={center.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{center.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                                    {center.location}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3">
                                                    <button 
                                                        onClick={() => generateSecurityBrief(center)}
                                                        className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                                                        title="AI Security Plan"
                                                    >
                                                        <BrainCircuit className="w-4 h-4" /> AI
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditCenter(center)}
                                                        className="text-amber-600 hover:text-amber-900 flex items-center gap-1"
                                                        title="Edit Details"
                                                    >
                                                        <Edit2 className="w-4 h-4" /> Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {centers.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-gray-500 italic">
                                                No voting centers added to this union yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        )}
    </div>
  );
};

export default UpazillaAdmin;