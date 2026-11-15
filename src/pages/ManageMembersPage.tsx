import { Plus, RotateCcw, Search, UserMinus } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { MemberRecord, Plan } from '../types';

export default function ManageMembersPage() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Add Member Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [planId, setPlanId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Confirm Soft-Delete Modal
  const [memberToRemove, setMemberToRemove] = useState<MemberRecord | null>(null);
  const [removing, setRemoving] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.all([
        api.get('/members', {
          params: { search, status: statusFilter, planId },
        }),
        api.get('/plans'),
      ]);
      setMembers(mRes.data.members || []);
      setPlans(pRes.data.plans || []);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, planId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (name.trim().length < 2) {
      setFormError('Member name must be at least 2 characters.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (phone.trim().length < 8) {
      setFormError('Please enter a valid phone number.');
      return;
    }
    if (address.trim().length < 5) {
      setFormError('Delivery address must be at least 5 characters.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/members', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        password,
        planId: planId || null,
      });
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPassword('');
      setPlanId('');
      setShowForm(false);
      await loadMembers();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateMember = async () => {
    if (!memberToRemove) return;
    setRemoving(true);
    try {
      await api.patch(`/members/${memberToRemove._id}/deactivate`);
      setMemberToRemove(null);
      await loadMembers();
    } finally {
      setRemoving(false);
    }
  };

  const handleReactivateMember = async (id: string) => {
    await api.patch(`/members/${id}/reactivate`);
    await loadMembers();
  };

  return (
    <DashboardLayout
      title="Manage Members"
      breadcrumb="Admin Console / Members"
      action={
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Add Member'}</span>
        </button>
      }
    >
      {/* Add Member Form */}
      {showForm && (
        <form
          onSubmit={handleAddMember}
          className="mb-8 bg-white border border-[#166534] rounded-xl p-6 space-y-4"
        >
          <h2 className="text-base font-semibold text-[#1A241E]">Add New Member</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kavya Menon"
                className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kavya@example.com"
                className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 22334"
                className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">
                Membership Plan
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              >
                <option value="">No Plan (Pay per order)</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ₹{p.monthlyPrice}/mo
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">
                Delivery Address *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat, Street, City"
                className="w-full px-3 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs rounded-lg">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-[#526056] bg-[#F4F7F2] rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-[#166534] hover:bg-[#14532D] rounded-lg cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Adding...' : 'Create Member'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filters */}
      <div className="mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#647469] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#EFF3EC] rounded-lg">
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                  statusFilter === st ? 'bg-white text-[#1A241E] shadow-sm' : 'text-[#526056]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            aria-label="Filter by plan"
            className="px-3 py-2 text-xs bg-white border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
          >
            <option value="all">All Plans</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-[#DDE4DA] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-sm text-[#526056]">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#526056]">
            No members match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8EDE5] text-xs text-[#647469] bg-[#FAFBF8]">
                  <th className="py-3 px-4 font-medium">Member</th>
                  <th className="py-3 px-4 font-medium">Phone &amp; Address</th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDE5]">
                {members.map((m) => (
                  <tr key={m._id} className="hover:bg-[#FAFBF8]">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#1A241E]">{m.name}</p>
                      <p className="text-xs text-[#647469]">{m.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#526056]">
                      <p className="font-mono tabular-nums text-[#1A241E]">{m.phone}</p>
                      <p className="truncate max-w-[240px]">{m.address || '—'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#35473B]">
                      {m.planName}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">
                      <span className={m.isActive ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {m.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {m.isActive ? (
                        <button
                          type="button"
                          onClick={() => setMemberToRemove(m)}
                          className="px-3 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-lg inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivateMember(m._id)}
                          className="px-3 py-1.5 text-xs font-medium text-[#166534] hover:bg-[#EDF5EE] border border-[#BBF7D0] rounded-lg inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reactivate</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(memberToRemove)}
        title={`Deactivate ${memberToRemove?.name}?`}
        description="This performs a soft delete (isActive = false), preserving order history while preventing login and pausing active subscriptions."
        confirmLabel="Deactivate Member"
        loading={removing}
        onConfirm={handleDeactivateMember}
        onCancel={() => setMemberToRemove(null)}
      />
    </DashboardLayout>
  );
}
