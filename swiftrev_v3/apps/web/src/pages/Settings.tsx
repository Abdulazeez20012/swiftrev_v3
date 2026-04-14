import { Save, Bell, Shield, RefreshCw, Upload, Image as ImageIcon, Camera } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import React, { useState, useEffect } from 'react';

interface Hospital {
    id: string;
    name: string;
    address?: string;
    status?: string;
}

const ToggleItem: React.FC<{
    title: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
}> = ({ title, description, checked, onChange }) => (
    <div className="flex justify-between items-start py-3 border-b border-border last:border-0">
        <div className="pr-8">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer mt-1">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary rounded-full"></div>
        </label>
    </div>
);

export const Settings: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Settings state
    const [fullProfile, setFullProfile] = useState<any>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // UI persistent toggles
    const [milestonesEnabled, setMilestonesEnabled] = useState(true);
    const [discrepancyAlerts, setDiscrepancyAlerts] = useState(true);
    const [twoFactor, setTwoFactor] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!currentUser?.hospitalId) return;
            setLoading(true);
            try {
                const hRes = await api.get(`/hospitals/${currentUser.hospitalId}`);
                setHospital(hRes.data);

                // Fetch full profile for avatar
                const uRes = await api.get(`/users/${currentUser.id}`);
                setFullProfile(uRes.data);
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [currentUser?.hospitalId, currentUser?.id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hospital' | 'user') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        if (type === 'hospital') setUploadingLogo(true);
        else setUploadingAvatar(true);

        try {
            const res = await api.post(`/uploads/profile?type=${type}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = res.data.url;

            if (type === 'hospital') {
                await api.patch(`/hospitals/${currentUser?.hospitalId}`, { logo_url: url });
                setHospital((prev: Hospital | null) => prev ? { ...prev, logo_url: url } : null);
            } else {
                await api.patch(`/users/${currentUser?.id}`, { avatar_url: url });
                setFullProfile((prev: any) => prev ? { ...prev, avatar_url: url } : null);
            }
            alert('Image updated successfully!');
        } catch (err) {
            console.error('Upload failed', err);
            alert('Upload failed. Please try again.');
        } finally {
            if (type === 'hospital') setUploadingLogo(false);
            else setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update hospital basic meta to show persistence works
            if (currentUser?.hospitalId && hospital) {
                await api.patch(`/hospitals/${currentUser.hospitalId}`, {
                    name: hospital.name,
                    address: hospital.address,
                    contactInfo: (hospital as any).contact_info,
                });
            }
            alert('Settings saved successfully!');
        } catch (err) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
                <RefreshCw size={18} className="animate-spin" /> Loading system configurations...
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">System Settings</h2>
                <p className="text-muted-foreground">Configure parameters for {hospital?.name || 'your hospital'}.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-8">
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <ImageIcon size={20} />
                            <h3 className="text-lg font-semibold text-foreground">Branding & Identity</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-6 p-4 bg-secondary/30 rounded-xl border border-border/50">
                                <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center border border-border overflow-hidden">
                                    {(hospital as any)?.logo_url ? (
                                        <img src={(hospital as any).logo_url} alt="Hospital Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <ImageIcon className="text-muted-foreground opacity-20" size={32} />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="font-bold text-sm">Hospital Logo</p>
                                    <p className="text-xs text-muted-foreground">Will appear on the sidebar and invoices. PNG/JPG recommended.</p>
                                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg cursor-pointer transition-colors text-xs font-bold">
                                        {uploadingLogo ? <RefreshCw className="animate-spin" size={12} /> : <Upload size={12} />}
                                        {uploadingLogo ? 'Uploading...' : 'Change Logo'}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'hospital')} disabled={uploadingLogo} />
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 p-4 bg-secondary/30 rounded-xl border border-border/50">
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-border overflow-hidden">
                                    {fullProfile?.avatar_url ? (
                                        <img src={fullProfile.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="text-primary opacity-30" size={32} />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="font-bold text-sm">Personal Avatar</p>
                                    <p className="text-xs text-muted-foreground">Shown in the sidebar and profile. Square images work best.</p>
                                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg cursor-pointer transition-colors text-xs font-bold border border-border">
                                        {uploadingAvatar ? <RefreshCw className="animate-spin" size={12} /> : <Camera size={12} />}
                                        {uploadingAvatar ? 'Uploading...' : 'Change Picture'}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'user')} disabled={uploadingAvatar} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <ImageIcon size={20} />
                            <h3 className="text-lg font-semibold text-foreground">Hospital Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Hospital Name</label>
                                <input
                                    type="text"
                                    value={hospital?.name || ''}
                                    onChange={(e) => setHospital(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                    placeholder="Enter hospital name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Information</label>
                                <input
                                    type="text"
                                    value={(hospital as any)?.contact_info || ''}
                                    onChange={(e) => setHospital(prev => prev ? { ...prev, contact_info: e.target.value } : null)}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                    placeholder="Phone or Email"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium">Physical Address</label>
                                <textarea
                                    value={hospital?.address || ''}
                                    onChange={(e) => setHospital(prev => prev ? { ...prev, address: e.target.value } : null)}
                                    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm min-h-[80px]"
                                    placeholder="Enter full hospital address"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-80 space-y-6">
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Bell size={20} />
                            <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                        </div>
                        <div className="space-y-4">
                            <ToggleItem
                                title="Revenue Milestones"
                                description="Daily targets."
                                checked={milestonesEnabled}
                                onChange={setMilestonesEnabled}
                            />
                            <ToggleItem
                                title="Discrepancy Alerts"
                                description="SMS alerts."
                                checked={discrepancyAlerts}
                                onChange={setDiscrepancyAlerts}
                            />
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-primary">
                            <Shield size={20} />
                            <h3 className="text-lg font-semibold text-foreground">Security</h3>
                        </div>
                        <div className="space-y-4">
                            <ToggleItem
                                title="2FA"
                                description="Enforce 2FA."
                                checked={twoFactor}
                                onChange={setTwoFactor}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2.5 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
                >
                    Discard Changes
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70"
                >
                    {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Configurations'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
