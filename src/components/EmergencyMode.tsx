import React, { useState } from 'react';
import { 
  AlertOctagon, 
  X, 
  Phone, 
  CheckSquare, 
  Navigation, 
  Droplets, 
  FileText, 
  Zap, 
  BriefcaseMedical, 
  Utensils, 
  Smartphone,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RiskStatus } from '../types';

interface EmergencyModeProps {
  isOpen: boolean;
  onClose: () => void;
  currentRisk: RiskStatus;
}

const EmergencyMode: React.FC<EmergencyModeProps> = ({ isOpen, onClose, currentRisk }) => {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const checklist = [
    { id: 'water', label: 'Air Minum (persediaan 3 hari)', icon: Droplets },
    { id: 'docs', label: 'Dokumen Penting (KTP, Asuransi)', icon: FileText },
    { id: 'light', label: 'Senter & Baterai Cadangan', icon: Zap },
    { id: 'aid', label: 'Kotak P3K & Obat-obatan', icon: BriefcaseMedical },
    { id: 'food', label: 'Makanan Tahan Lama', icon: Utensils },
    { id: 'power', label: 'Power Bank & Kabel Charger', icon: Smartphone },
  ];

  const contacts = [
    { label: 'Darurat Umum', number: '112', desc: 'Layanan Darurat Terpadu' },
    { label: 'Ambulans / Kemenkes', number: '119', desc: 'Gawat Darurat Medis' },
    { label: 'SAR (BASARNAS)', number: '115', desc: 'Pencarian dan Pertolongan' },
    { label: 'Polisi (Polri)', number: '110', desc: 'Keamanan dan Ketertiban' },
    { label: 'Pemadam Kebakaran', number: '113', desc: 'Pemadam Kebakaran' },
  ];

  const getAdvice = () => {
    if (currentRisk === 'danger') {
      return {
        title: 'TINDAKAN SEGERA DIPERLUKAN',
        steps: [
          'Merunduk, Berlindung, dan Bertahan jika terasa guncangan.',
          'Pindah ke tempat yang lebih tinggi jika risiko banjir tinggi.',
          'Matikan gas dan listrik jika aman untuk dilakukan.',
          'Dengarkan radio lokal atau media sosial resmi untuk pembaruan.'
        ]
      };
    }
    return {
      title: 'LANGKAH KESIAPSIAGAAN',
      steps: [
        'Identifikasi rute evakuasi terdekat Anda.',
        'Simpan tas darurat Anda di dekat pintu keluar.',
        'Komunikasikan status Anda kepada anggota keluarga.',
        'Menjauh dari bangunan tinggi dan tiang listrik.'
      ]
    };
  };

  const advice = getAdvice();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-rose-600 text-white overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-[110] bg-rose-700 px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
              <h1 className="text-xl font-black tracking-tighter uppercase">Mode Darurat</h1>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-rose-500 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 max-w-2xl mx-auto space-y-8 pb-20">
            {/* Critical Advice */}
            <motion.section 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-5 h-5" />
                <h2 className="font-black text-sm uppercase tracking-widest">{advice.title}</h2>
              </div>
              <ul className="space-y-3">
                {advice.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm font-bold leading-relaxed">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-white text-rose-600 flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Emergency Contacts */}
            <motion.section 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5" />
                <h2 className="font-black text-sm uppercase tracking-widest">Kontak Darurat (ID)</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {contacts.map((contact, i) => (
                  <a 
                    key={i}
                    href={`tel:${contact.number}`}
                    className="bg-white p-4 rounded-2xl flex items-center justify-between group active:scale-95 transition-transform"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{contact.label}</p>
                      <p className="text-xl font-black text-rose-600">{contact.number}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{contact.desc}</p>
                    </div>
                    <div className="p-3 rounded-full bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                  </a>
                ))}
              </div>
            </motion.section>

            {/* Checklist */}
            <motion.section 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare className="w-5 h-5" />
                <h2 className="font-black text-sm uppercase tracking-widest">Daftar Kelangsungan Hidup</h2>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 divide-y divide-white/10">
                {checklist.map((item) => {
                  const ItemIcon = item.icon;
                  const isChecked = checkedItems.includes(item.id);
                  return (
                    <button 
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className={`
                        w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
                        ${isChecked ? 'bg-white border-white' : 'border-white/40'}
                      `}>
                        {isChecked && <X className="w-4 h-4 text-rose-600" />}
                      </div>
                      <ItemIcon className="w-5 h-5 opacity-70" />
                      <span className={`text-sm font-bold ${isChecked ? 'line-through opacity-50' : ''}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            <div className="text-center pt-4">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">
                ResQAI • Know the Risk • Act Fast
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmergencyMode;
