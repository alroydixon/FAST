'use client';

import React, { useState } from 'react';
import { UserPlus, ShieldAlert, Award, Stethoscope, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { AthleteProfile, StaffProfile, TrainingPhase, SportingCode } from '@/types/athlete';
import { pushAthletesToSupabase, pushStaffProfileToSupabase } from '../services/supabaseService';

interface RegistrationProps {
  onOnboardingComplete: (profile: { id: string; name: string; role: 'athlete' | 'coach' | 'medical_staff' }) => void;
}

export default function RoleRegistration({ onOnboardingComplete }: RegistrationProps) {
  // Active Onboarding Track Selection: 'athlete' | 'coach' | 'medical_staff'
  const [selectedRole, setSelectedRole] = useState<'athlete' | 'coach' | 'medical_staff'>('athlete');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Athlete Registration States
  const [athleteForm, setAthleteForm] = useState({
    name: '',
    sport: 'Track & Field (Sprints)',
    sportingCode: 'Track & Field' as SportingCode,
    trackDiscipline: 'Sprints' as 'Sprints' | 'Middle Distance',
    age: 22,
    gender: 'male' as 'male' | 'female',
    weightKg: 78.0,
    heightCm: 182,
    restingHR: 50,
    maxHR: 195,
    currentPhase: 'In-Season' as TrainingPhase,
    email: '',
    phone: ''
  });

  const handleAthleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    const generatedId = `ath-${Date.now()}`;
    const newAthlete: AthleteProfile = {
      id: generatedId,
      name: athleteForm.name,
      sport: athleteForm.sport,
      sportingCode: athleteForm.sportingCode,
      trackDiscipline: athleteForm.trackDiscipline,
      age: Number(athleteForm.age),
      gender: athleteForm.gender,
      weightKg: Number(athleteForm.weightKg),
      heightCm: Number(athleteForm.heightCm),
      restingHR: Number(athleteForm.restingHR),
      maxHR: Number(athleteForm.maxHR),
      currentPhase: athleteForm.currentPhase,
      email: athleteForm.email || undefined,
      phone: athleteForm.phone || undefined
    };

    const res = await pushAthletesToSupabase([newAthlete]);
    setIsSubmitting(false);

    if (res.success) {
      setStatusMsg({ success: true, text: 'Athlete onboarded and synced to Supabase!' });
      setTimeout(() => onOnboardingComplete({ id: generatedId, name: newAthlete.name, role: 'athlete' }), 1200);
    } else {
      setStatusMsg({ success: false, text: res.errorDetails || 'Registration transaction failed.' });
    }
  };
  // Staff Registration States
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    specialization: '',
    licenseNumber: ''
  });

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    const generatedId = `${selectedRole === 'coach' ? 'ch' : 'med'}-${Date.now()}`;
    const newStaff: StaffProfile = {
      id: generatedId,
      name: staffForm.name,
      email: staffForm.email,
      roleType: selectedRole === 'coach' ? 'coach' : 'medical_staff',
      specialization: staffForm.specialization,
      licenseNumber: staffForm.licenseNumber || undefined
    };

    const res = await pushStaffProfileToSupabase(newStaff);
    setIsSubmitting(false);

    if (res.success) {
      setStatusMsg({ success: true, text: `${selectedRole === 'coach' ? 'Coach' : 'Medical Clinician'} successfully registered on the cloud!` });
      setTimeout(() => onOnboardingComplete({ id: generatedId, name: newStaff.name, role: newStaff.roleType }), 1200);
    } else {
      setStatusMsg({ success: false, text: res.message || 'Staff registration transaction failed.' });
    }
  };
  return (
        <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-1.5 border-b border-slate-800 pb-5">
        <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center justify-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" /> First At Sports Registration
        </h2>
        <p className="text-xs text-slate-400">Initialize a new credential profile cluster inside the management platform matrix.</p>
      </div>

      {/* Role Selection Blocks */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button" onClick={() => { setSelectedRole('athlete'); setStatusMsg(null); }}
          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${selectedRole === 'athlete' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          <Award className="w-4 h-4" />
          <span className="text-[11px] font-black uppercase tracking-wider">Athlete</span>
        </button>
        <button
          type="button" onClick={() => { setSelectedRole('coach'); setStatusMsg(null); }}
          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${selectedRole === 'coach' ? 'bg-amber-600/10 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span className="text-[11px] font-black uppercase tracking-wider">Coach</span>
        </button>
        <button
          type="button" onClick={() => { setSelectedRole('medical_staff'); setStatusMsg(null); }}
          className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${selectedRole === 'medical_staff' ? 'bg-teal-600/10 border-teal-500 text-teal-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
        >
          <Stethoscope className="w-4 h-4" />
          <span className="text-[11px] font-black uppercase tracking-wider">Medical Staff</span>
        </button>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${statusMsg.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* RENDER ATHLETE FORM IF SELECTED */}
      {selectedRole === 'athlete' && (
        <form onSubmit={handleAthleteSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400">Full Name</label>
              <input
                type="text" required placeholder="e.g. Marcus Vance" value={athleteForm.name}
                onChange={e => setAthleteForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400">Sport Discipline</label>
              <input
                type="text" required placeholder="e.g. Track &amp; Field (Sprints)" value={athleteForm.sport}
                onChange={e => setAthleteForm(p => ({ ...p, sport: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Age</label>
              <input
                type="number" required value={athleteForm.age}
                onChange={e => setAthleteForm(p => ({ ...p, age: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Weight (Kg)</label>
              <input
                type="number" step="0.1" required value={athleteForm.weightKg}
                onChange={e => setAthleteForm(p => ({ ...p, weightKg: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Height (Cm)</label>
              <input
                type="number" required value={athleteForm.heightCm}
                onChange={e => setAthleteForm(p => ({ ...p, heightCm: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400">Resting HR (BPM)</label>
              <input
                type="number" required value={athleteForm.restingHR}
                onChange={e => setAthleteForm(p => ({ ...p, restingHR: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400">Max HR (BPM)</label>
              <input
                type="number" required value={athleteForm.maxHR}
                onChange={e => setAthleteForm(p => ({ ...p, maxHR: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md">
            <span>Onboard Athlete Portal</span> <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
      {/* RENDER STAFF FORM IF SELECTING COACH OR CLINICAL MEDICAL */}
      {selectedRole !== 'athlete' && (
        <form onSubmit={handleStaffSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400">Staff Full Name</label>
              <input
                type="text" required placeholder="e.g. Dr. Sarah Jenkins" value={staffForm.name}
                onChange={e => setStaffForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400">Secure Email address</label>
              <input
                type="email" required placeholder="name@performancehub.com" value={staffForm.email}
                onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400">Specialization / Role Description</label>
              <input
                type="text" required placeholder={selectedRole === 'coach' ? 'e.g. Olympic Sprints Director' : 'e.g. Orthopedic Sports Physical Therapist'}
                value={staffForm.specialization}
                onChange={e => setStaffForm(p => ({ ...p, specialization: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-slate-400">Professional License / Credential Key (Optional)</label>
              <input
                type="text" placeholder="e.g. MED-LIC-99214A" value={staffForm.licenseNumber}
                onChange={e => setStaffForm(p => ({ ...p, licenseNumber: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full py-3 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md ${selectedRole === 'coach' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-teal-400 hover:bg-teal-300'}`}>
            <span>Register Performance Staff Credentials</span> <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
