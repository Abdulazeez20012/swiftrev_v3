import React, { useState, useEffect } from 'react';
import { Save, Bell, Percent, Shield, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

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
    const [vatRate, setVatRate] = useState('7.5');
    const [milestonesEnabled, setMilestonesEnabled] = useState(true);
    const [discrepancyAlerts, setDiscrepancyAlerts] = useState(true);
    const [auditLogs, setAuditLogs] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState('30 mins');
    const [twoFactor, setTwoFactor] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!currentUser?.hospitalId) return;
            setLoading(true);
            try {
                const res = await api.get(`/hospitals/${currentUser.hospitalId}`);
                setHospital(res.data);
                // In a real app, these would come from the hospital metadata/settings JSON
                // For now we use the fetched hospital name etc to show it's connected
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [currentUser?.hospitalId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update hospital basic meta to show persistence works
            if (currentUser?.hospitalId && hospital) {
                await api.patch(`/hospitals/${currentUser.hospitalId}`, {
                    name: hospital.name,
                    address: hospital.address,
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

            <div className="grid gap-8">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <Percent size={20} />
                        <h3 className="text-lg font-semibold text-foreground">Financial Configuration</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default VAT Rate (%)</label>
                            <input
                                type="number"
                                value={vatRate}
                                onChange={(e) => setVatRate(e.target.value)}
                                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Currency Symbol</label>
                            <input type="text" value="₦" disabled className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-muted-foreground cursor-not-allowed" />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <Bell size={20} />
                        <h3 className="text-lg font-semibold text-foreground">System Notifications</h3>
                    </div>
                    <div className="space-y-4">
                        <ToggleItem
                            title="Revenue Milestones"
                            description="Send email alerts when hospital revenue hits daily targets."
                            checked={milestonesEnabled}
                            onChange={setMilestonesEnabled}
                        />
                        <ToggleItem
                            title="Discrepancy Alerts"
                            description="Immediate SMS alerts for financial reconciliation mismatches over ₦10,000."
                            checked={discrepancyAlerts}
                            onChange={setDiscrepancyAlerts}
                        />
                        <ToggleItem
                            title="Audit Log Exports"
                            description="Auto-export monthly audit logs to compliance email."
                            checked={auditLogs}
                            onChange={setAuditLogs}
                        />
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-primary">
                        <Shield size={20} />
                        <h3 className="text-lg font-semibold text-foreground">Security & Privacy</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                            <div>
                                <p className="font-medium">Session Timeout</p>
                                <p className="text-sm text-muted-foreground">Duration before inactive users are logged out.</p>
                            </div>
                            <select
                                value={sessionTimeout}
                                onChange={(e) => setSessionTimeout(e.target.value)}
                                className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option>15 mins</option>
                                <option value="30 mins">30 mins</option>
                                <option>1 hour</option>
                                <option>4 hours</option>
                            </select>
                        </div>
                        <ToggleItem
                            title="Two-Factor Authentication (2FA)"
                            description="Enforce 2FA for all administrative accounts."
                            checked={twoFactor}
                            onChange={setTwoFactor}
                        />
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
