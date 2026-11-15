import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createAppointment,
  fetchAppointments,
  updateAppointmentStatus,
} from '../services/supabaseData';
import { Appointment } from '../types';

const GOALS = [
  'Weight Management',
  'Muscle & High Protein',
  'Plant-Based Transition',
  'Balanced Daily Nutrition',
];

const SLOTS = [
  '9:30 AM - 10:00 AM',
  '11:30 AM - 12:00 PM',
  '3:00 PM - 3:30 PM',
  '5:30 PM - 6:00 PM',
];

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [memberName, setMemberName] = useState(user?.name || '');
  const [memberEmail, setMemberEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [goal, setGoal] = useState(GOALS[0]);
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState(SLOTS[0]);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (user) {
      setMemberName((prev) => prev || user.name);
      setMemberEmail((prev) => prev || user.email);
      setPhone((prev) => prev || user.phone);

      fetchAppointments({
        isAdmin: user.role === 'admin',
        userId: user._id,
        userEmail: user.email,
      })
        .then((list) => setAppointments(list))
        .catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConfirmed(null);

    if (memberName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(memberEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (phone.trim().length < 8) {
      setError('Please enter a valid phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const { appointment } = await createAppointment({
        userId: user?._id || null,
        memberName: memberName.trim(),
        memberEmail: memberEmail.trim(),
        phone: phone.trim(),
        goal,
        appointmentDate,
        timeSlot,
        notes: notes.trim(),
      });
      setConfirmed(appointment);
      setAppointments((prev) => [appointment, ...prev]);
      setNotes('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Unable to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: Appointment['status']) => {
    try {
      const updated = await updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => (a._id === id ? updated : a)));
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-10">
      <div className="pb-8 border-b border-[#DDE4DA]">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1A241E]">
          Nutrition Consultation Appointments
        </h1>
        <p className="text-sm text-[#526056] mt-2 max-w-2xl">
          Schedule a 1-on-1 session with our registered dietitian to tailor your daily salad macros
          and monthly membership plan.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-[#DDE4DA] rounded-xl p-6 space-y-5"
        >
          <h2 className="font-display text-xl font-semibold text-[#1A241E]">
            Book a New Appointment
          </h2>

          {confirmed && (
            <div className="p-4 bg-[#EDF5EE] border border-[#BBF7D0] text-[#166534] rounded-xl flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Appointment Confirmed</p>
                <p className="text-xs mt-0.5 font-mono">
                  {confirmed.appointmentDate} · {confirmed.timeSlot} · {confirmed.goal}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Ananya Sharma"
                className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">
                Nutrition Goal
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">
                Preferred Date *
              </label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534] font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#35473B] mb-1">
                Preferred Time Slot *
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534] font-mono"
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#35473B] mb-1">
              Dietary Notes or Allergies (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lactose intolerant, aiming for 1,800 kcal/day"
              className="w-full px-3.5 py-2 text-sm border border-[#DDE4DA] rounded-lg focus:outline-none focus:border-[#166534]"
            />
          </div>

          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-5 bg-[#166534] hover:bg-[#14532D] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Booking Appointment...' : 'Create Appointment'}
          </button>
        </form>

        {/* Scheduled Appointments List */}
        <aside className="lg:col-span-5 bg-white border border-[#DDE4DA] rounded-xl p-6">
          <h2 className="font-display text-xl font-semibold text-[#1A241E]">
            {user?.role === 'admin' ? 'All Scheduled Appointments' : 'Your Appointments'}
          </h2>
          <p className="text-xs text-[#647469] mt-1">
            Newly created appointments appear immediately below and sync with the backend database.
          </p>

          {appointments.length === 0 ? (
            <div className="mt-6 py-8 text-center border-t border-[#E8EDE5] text-sm text-[#526056]">
              No appointments booked in this session yet.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#E8EDE5]">
              {appointments.map((appt) => (
                <li key={appt._id} className="py-4 first:pt-2 last:pb-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#1A241E]">{appt.memberName}</p>
                      <p className="text-xs text-[#526056]">{appt.goal}</p>
                    </div>
                    {user?.role === 'admin' ? (
                      <select
                        value={appt.status}
                        onChange={(e) =>
                          handleStatusChange(appt._id, e.target.value as Appointment['status'])
                        }
                        className="px-2 py-1 text-xs border border-[#DDE4DA] rounded-md bg-white"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs font-medium ${
                          appt.status === 'Scheduled'
                            ? 'text-[#166534]'
                            : appt.status === 'Completed'
                            ? 'text-[#16A34A]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {appt.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-[#647469]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {appt.appointmentDate}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {appt.timeSlot}
                    </span>
                  </div>
                  {appt.notes && <p className="text-xs text-[#526056]">{appt.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
