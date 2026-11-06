'use client';

import React, { useState } from 'react';
import { 
  Stethoscope, 
  Activity, 
  AlertOctagon, 
  Heart, 
  PlusCircle, 
  Clipboard, 
  FileText, 
  CheckCircle,
  Crosshair
} from 'lucide-react';
import { MedicalRecord, InjuryLog, ClearanceStatus } from '@/types/athlete';
import { pushMedicalRecordToSupabase, pushInjuryLogToSupabase } from '../services/supabaseService';

interface MedicalHubProps {
  athleteId: string;
  clinicianId: string;
  onRecordCommitted: () => void;
}

export default function MedicalHub({ athleteId, clinicianId, onRecordCommitted }: MedicalHubProps) {
  // Tab view controller: 'soap-log' | 'injury-track'
  const [medTab, setMedTab] = useState<'soap-log' | 'injury-track'>('soap-log');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);

  // EMR SOAP Encounter Form States
  const [soapForm, setSoapForm] = useState({
    encounterType: 'Initial Assessment' as MedicalRecord['encounterType'],
    primaryComplaint: '',
    objectiveFindings: '',
    assessmentDiagnosis: '',
    treatmentPlan: '',
    clearanceStatus: 'FULL_CLEARANCE' as ClearanceStatus,
    restrictionNotes: ''
  });

  // Longitudinal Injury Track States
  const [injuryForm, setInjuryForm] = useState({
    anatomicalSite: '',
    injuryType: '',
    severity: 'Mild' as InjuryLog['severity'],
    estimatedDaysOut: 14,
    status: 'Acute Recovery' as InjuryLog['status']
  });

  const handleSoapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setFeedback(null);

    const record: MedicalRecord = {
      id: `emr-${Date.now()}`,
      athleteId,
      clinicianId,
      date: new Date().toISOString().split('T')[0],
      ...soapForm,
      restrictionNotes: soapForm.restrictionNotes || undefined
    };

    const res = await pushMedicalRecordToSupabase(record);
    setIsProcessing(false);

    if (res.success) {
      setFeedback({ success: true, text: 'Clinical SOAP Encounter successfully written to Supabase EMR tables!' });
      onRecordCommitted();
      setSoapForm({
        encounterType: 'Initial Assessment',
        primaryComplaint: '',
        objectiveFindings: '',
        assessmentDiagnosis: '',
        treatmentPlan: '',
        clearanceStatus: 'FULL_CLEARANCE',
        restrictionNotes: ''
      });
    } else {
      setFeedback({ success: false, text: res.message || 'Database connection error during write.' });
    }
  };
  const handleInjurySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setFeedback(null);

    const log: InjuryLog = {
      id: `inj-${Date.now()}`,
      athleteId,
      injuryDate: new Date().toISOString().split('T')[0],
      anatomicalSite: injuryForm.anatomicalSite,
      injuryType: injuryForm.injuryType,
      severity: injuryForm.severity,
      estimatedDaysOut: Number(injuryForm.estimatedDaysOut),
      status: injuryForm.status
    };

    const res = await pushInjuryLogToSupabase(log);
    setIsProcessing(false);

    if (res.success) {
      setFeedback({ success: true, text: 'Longitudinal Injury Track entry synchronized successfully!' });
      onRecordCommitted();
      setInjuryForm({
        anatomicalSite: '',
        injuryType: '',
        severity: 'Mild',
        estimatedDaysOut: 14,
        status: 'Acute Recovery'
      });
    } else {
      setFeedback({ success: false, text: res.message || 'Database write error.' });
    }
  };
  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-black text-white uppercase tracking-tight">Clinical Medical Workspace</h2>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button 
            type="button" onClick={() => setMedTab('soap-log')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${medTab === 'soap-log' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            SOAP Chart Log
          </button>
          <button 
            type="button" onClick={() => setMedTab('injury-track')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${medTab === 'injury-track' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Injury RTP Track
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 text-xs font-semibold ${feedback.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* RENDER SOAP PANEL FORM */}
      {medTab === 'soap-log' && (
        <form onSubmit={handleSoapSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Encounter Context</label>
              <select 
                value={soapForm.encounterType} onChange={e => setSoapForm(p => ({ ...p, encounterType: e.target.value as any }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option>Initial Assessment</option>
                <option>Follow-up Consultation</option>
                <option>Emergency Triage</option>
                <option>Pre-Participation Screen</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Clearance Status</label>
              <select 
                value={soapForm.clearanceStatus} onChange={e => setSoapForm(p => ({ ...p, clearanceStatus: e.target.value as any }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="FULL_CLEARANCE">FULL CLEARANCE (Unrestricted)</option>
                <option value="MODIFIED_RESTRICTION">MODIFIED AMBULATORY (Capped Volume)</option>
                <option value="COMPULSORY_REMOVAL">COMPULSORY MEDICAL REMOVAL (Red Light)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Subjective Complaint</label>
            <input 
              type="text" required placeholder="e.g. Acute pain in proximal hamstring during terminal swing phase phase..." value={soapForm.primaryComplaint}
              onChange={e => setSoapForm(p => ({ ...p, primaryComplaint: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase">Objective Clinical Findings</label>
            <textarea 
              rows={2} required placeholder="Palpation discomfort, manual muscle test grade, active range of motion restriction values..." value={soapForm.objectiveFindings}
              onChange={e => setSoapForm(p => ({ ...p, objectiveFindings: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Assessment &amp; Clinical Impression</label>
              <textarea 
                rows={2} required placeholder="Diagnosis markers (e.g. Tendinopathy, Grade I strain)..." value={soapForm.assessmentDiagnosis}
                onChange={e => setSoapForm(p => ({ ...p, assessmentDiagnosis: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Prescribed Treatment Plan</label>
              <textarea 
                rows={2} required placeholder="Modalities used, isometric loading parameters, eccentric pacing tracks..." value={soapForm.treatmentPlan}
                onChange={e => setSoapForm(p => ({ ...p, treatmentPlan: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {soapForm.clearanceStatus !== 'FULL_CLEARANCE' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-rose-400 uppercase">Explicit Restrictions Notes</label>
              <input 
                type="text" required placeholder="e.g. Cap track high-velocity sprints under 80% maximum speed parameters." value={soapForm.restrictionNotes}
                onChange={e => setSoapForm(p => ({ ...p, restrictionNotes: e.target.value }))}
                className="w-full bg-slate-950 border border-rose-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          )}

          <button type="submit" disabled={isProcessing} className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md">
            Commit Clinical SOAP Chart Entry
          </button>
        </form>
      )}
      {/* RENDER INJURY TIMELINE RTP TRACK FORM */}
      {medTab === 'injury-track' && (
        <form onSubmit={handleInjurySubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Anatomical Structure Site</label>
              <input 
                type="text" required placeholder="e.g. Left Achilles Tendon Midsubstance" value={injuryForm.anatomicalSite}
                onChange={e => setInjuryForm(p => ({ ...p, anatomicalSite: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Injury Diagnosis Classification</label>
              <input 
                type="text" required placeholder="e.g. Enthesopathy Strain" value={injuryForm.injuryType}
                onChange={e => setInjuryForm(p => ({ ...p, injuryType: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Severity Category</label>
              <select 
                value={injuryForm.severity} onChange={e => setInjuryForm(p => ({ ...p, severity: e.target.value as any }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option>Mild</option>
                <option>Moderate</option>
                <option>Severe</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Estimated Days Out</label>
              <input 
                type="number" required value={injuryForm.estimatedDaysOut}
                onChange={e => setInjuryForm(p => ({ ...p, estimatedDaysOut: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Active Rehab Phase</label>
              <select 
                value={injuryForm.status} onChange={e => setInjuryForm(p => ({ ...p, status: e.target.value as any }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option>Acute Recovery</option>
                <option>Functional Rehabilitation</option>
                <option>Return-to-Play Protocol</option>
                <option>Fully Resolved</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={isProcessing} className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md">
            Save Injury Timeline Log
          </button>
        </form>
      )}
    </div>
  );
}
