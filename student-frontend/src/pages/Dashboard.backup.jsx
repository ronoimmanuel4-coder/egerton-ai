import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { courseAPI } from '../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    userAcademic,
    setUserAcademic,
  } = useStore();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [unitsByPeriod, setUnitsByPeriod] = useState({});
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const hasFetchedUnitsRef = useRef(false);
  const isMountedRef = useRef(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Track component mount/unmount to avoid setting state after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const availablePeriods = useMemo(() => {
    const keys = Object.keys(unitsByPeriod || {});
    return keys
      .map((key) => {
        const numeric = Number(key);
        return Number.isNaN(numeric) ? key : numeric;
      })
      .sort((a, b) => Number(a) - Number(b));
  }, [unitsByPeriod]);

  useEffect(() => {
    if (!availablePeriods.length) return;
    if (!currentPeriod) {
      setCurrentPeriod(availablePeriods[0]);
    }
  }, [availablePeriods, currentPeriod]);

  const firstName = useMemo(() => {
    if (!user) return 'Friend';
    if (user.firstName) return user.firstName;
    if (user.name) return user.name.split(' ')[0];
    return 'Friend';
  }, [user]);

  // Load course units once per session for the authenticated student
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    if (hasFetchedUnitsRef.current) {
      return;
    }

    const rawCourse = user.course;
    const rawYear = user.yearOfStudy;

    if (!rawCourse || rawYear == null) {
      return;
    }

    const courseId =
      typeof rawCourse === 'string'
        ? rawCourse
        : typeof rawCourse === 'object' && typeof rawCourse._id === 'string'
          ? rawCourse._id
          : null;

    const yearNumber = Number(rawYear);

    if (!courseId || Number.isNaN(yearNumber)) {
      return;
    }

    hasFetchedUnitsRef.current = true;

    const loadUnits = async () => {
      console.log('[Dashboard] Starting units fetch...', { courseId, yearNumber });
      setUnitsLoading(true);
      setUnitsError(null);

      try {
        const { data } = await courseAPI.getUnitsForYear(courseId, yearNumber);
        console.log('[Dashboard] API Response:', data);
        if (!isMountedRef.current) {
          console.log('[Dashboard] Component unmounted, not setting state');
          return;
        }

        const units = data?.units || {};
        console.log('[Dashboard] Setting units:', units);
        setUnitsByPeriod(units);
        
        const keys = Object.keys(units || {});
        console.log('[Dashboard] Available periods:', keys);
        if (keys.length > 0) {
          const firstPeriod = Number.isNaN(Number(keys[0])) ? keys[0] : Number(keys[0]);
          console.log('[Dashboard] Setting current period to:', firstPeriod);
          setCurrentPeriod(firstPeriod);
        }
        
        setUnitsLoading(false);
        setUserAcademic({
          loading: false,
          rawUnitsByPeriod: units,
          courseInfo: data?.course || null,
          course: courseId,
          year: yearNumber,
        });
        console.log('[Dashboard] Units loaded successfully');
      } catch (error) {
        console.error('[Dashboard] Failed to load units:', error);
        setUnitsLoading(false);
        setUnitsError('Unable to load your course units right now. Please try again shortly.');
        setUserAcademic({
          loading: false,
          error: 'Unable to load your course units right now. Please try again shortly.',
        });
      }
    };

    loadUnits();
  }, [isAuthenticated, user, setUserAcademic]);

  const currentPeriodLabel = userAcademic.periodLabel || 'Semester';
  const currentPeriodNumber = currentPeriod;
  const currentUnits = (unitsByPeriod && (unitsByPeriod[currentPeriod] || unitsByPeriod[String(currentPeriod)])) || [];
  const courseName = userAcademic.courseInfo?.name || 'Your Programme';
  const studyYear = userAcademic.year || user?.yearOfStudy || '—';

  const unitsByPeriodEntries = useMemo(() => {
    const entries = Object.entries(unitsByPeriod || {});
    return entries
      .map(([periodKey, units]) => {
        const numeric = Number(periodKey);
        const safeUnits = Array.isArray(units) ? units : [];
        return {
          key: periodKey,
          label: Number.isNaN(numeric)
            ? `${currentPeriodLabel} ${periodKey}`
            : `${currentPeriodLabel} ${numeric}`,
          numeric,
          units: safeUnits,
        };
      })
      .sort((a, b) => (Number.isNaN(a.numeric) ? 0 : a.numeric) - (Number.isNaN(b.numeric) ? 0 : b.numeric));
  }, [unitsByPeriod, currentPeriodLabel]);

  // Entries to display in the right-hand list: only the selected period
  const displayedEntries = useMemo(() => {
    if (currentPeriod == null) return unitsByPeriodEntries;
    return unitsByPeriodEntries.filter((e) => String(e.key) === String(currentPeriod));
  }, [unitsByPeriodEntries, currentPeriod]);

  const totalUnitsOffered = useMemo(() => {
    return unitsByPeriodEntries.reduce((count, entry) => count + entry.units.length, 0);
  }, [unitsByPeriodEntries]);

  const displayedUnitsCount = useMemo(() => {
    return displayedEntries.reduce((count, entry) => count + entry.units.length, 0);
  }, [displayedEntries]);

  const handlePeriodSelect = (period) => {
    setCurrentPeriod(period);
  };

  const handleRefreshUnits = () => {
    setUnitsByPeriod({});
    setCurrentPeriod(null);
    setUnitsError(null);
    setUnitsLoading(false);
    hasFetchedUnitsRef.current = false;
    setUserAcademic({
      rawUnitsByPeriod: {},
      courseInfo: null,
    });
  };

  return (
    <div className="min-h-screen bg-[#000510]">
      <div className="relative z-10 pointer-events-none">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 left-0 right-0 px-4 py-6 backdrop-blur-lg bg-black/60"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="glass-effect px-6 py-3 rounded-full">
              <h2 className="text-white font-semibold">
                Welcome home, <span className="text-egerton-green">{firstName}</span>! 👋
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Voice Command Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleVoiceCommand}
                className={`pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-egerton-green pulse-glow'
                    : 'glass-effect'
                }`}
              >
                <span className="text-2xl">{isListening ? '🎤' : '🎙️'}</span>
              </motion.button>

              {/* Back Button */}
              <button
                onClick={() => navigate('/')}
                className="pointer-events-auto glass-effect px-4 py-2 rounded-full text-white hover:border-egerton-green/50 transition-all"
              >
                Home
              </button>
            </div>
          </div>
        </motion.div>

        {/* Voice Status */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-20 left-1/2 transform -translate-x-1/2"
            >
              <div className="glass-effect px-6 py-3 rounded-full border-2 border-egerton-green">
                <p className="text-white font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-egerton-green rounded-full animate-pulse"></span>
                  Listening... Say "Hey Egerton AI"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Active Notification */}
        <AnimatePresence>
          {voiceActive && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <div className="bg-egerton-green/90 backdrop-blur-xl px-8 py-4 rounded-2xl border border-egerton-gold shadow-2xl">
                <p className="text-white text-lg font-semibold flex items-center gap-3">
                  <span className="text-3xl">🤖</span>
                  AI is speaking...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 mt-12"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard icon="🎓" label="Programme" value={courseName} color="egerton-green" />
            <StatCard icon="📆" label="Year" value={`Year ${studyYear}`} color="egerton-gold" />
            <StatCard icon="🌀" label={`Current ${currentPeriodLabel}`} value={currentPeriodNumber ? `${currentPeriodLabel} ${currentPeriodNumber}` : '—'} color="egerton-red" />
            <StatCard icon="📚" label="Units this period" value={currentUnits.length.toString()} color="egerton-dark-green" />
            <StatCard icon="🧭" label="Total units offered" value={totalUnitsOffered.toString()} color="egerton-gold" />
          </div>
        </motion.div>

        {/* Personalized study partner capsule */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 mt-12"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
            <div className="glass-effect px-6 py-5 rounded-2xl border border-white/10 pointer-events-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Your AI Study Partner</p>
                  <h3 className="text-lg font-semibold text-white mt-2" style={{ letterSpacing: '-0.01em' }}>{courseName}</h3>
                  <p className="text-xs text-white/50 mt-1" style={{ letterSpacing: '0.2em' }}>
                    Year {studyYear} • {currentPeriodLabel}s tailored just for you
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshUnits}
                  className="text-xs uppercase tracking-[0.3em] text-white/50 hover:text-egerton-green transition-colors"
                >
                  Refresh
                </button>
              </div>

              {userAcademic.error && (
                <div className="mt-4 p-3 border border-red-500/40 bg-red-500/10 text-xs text-red-300 rounded-lg">
                  {userAcademic.error}
                </div>
              )}

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Select {currentPeriodLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {availablePeriods.length > 0 ? (
                    availablePeriods.map((period) => {
                      const isActive = Number(period) === Number(currentPeriodNumber);
                      return (
                        <button
                          key={period}
                          type="button"
                          onClick={() => handlePeriodSelect(period)}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                            isActive
                              ? 'border-egerton-green bg-egerton-green/30 text-white'
                              : 'border-white/10 text-white/60 hover:border-egerton-green/40 hover:text-white'
                          }`}
                        >
                          {currentPeriodLabel} {period}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-white/40">No {currentPeriodLabel.toLowerCase()}s available yet.</span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Your units</p>
                {unitsLoading ? (
                  <div className="flex items-center gap-3 text-white/60 text-sm">
                    <span className="w-2 h-2 bg-egerton-green rounded-full animate-ping"></span>
                    Fetching personalised units...
                  </div>
                ) : currentUnits.length > 0 ? (
                  <ul className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {currentUnits.map((unit) => (
                      <li
                        key={unit._id}
                        className="p-3 rounded-lg border border-white/10 bg-white/5 hover:border-egerton-green/40 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>{unit.unitName}</p>
                            <p className="text-[11px] uppercase tracking-[0.3em] text-white/40 mt-1">{unit.unitCode}</p>
                          </div>
                          <span className="text-xs text-white/50">{unit.creditHours ? `${unit.creditHours} CH` : 'Core'}</span>
                        </div>
                        {unit.description && (
                          <p className="text-xs text-white/60 mt-2 line-clamp-2">{unit.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-white/50">
                    We don’t have units for this {currentPeriodLabel.toLowerCase()} yet. Tap refresh or check back soon.
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-8">
              <div className="glass-effect px-6 py-5 rounded-2xl border border-white/10 pointer-events-auto">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">All units offered</p>
                    <h3 className="text-lg font-semibold text-white mt-2" style={{ letterSpacing: '-0.01em' }}>
                      {currentPeriod ? displayedUnitsCount : totalUnitsOffered} units for Year {studyYear}
                    </h3>
                  </div>
                </div>

                <div className="mt-5 space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {displayedEntries.length > 0 ? (
                    displayedEntries.map((entry) => (
                      <div key={entry.key} className="border border-white/10 rounded-xl overflow-hidden">
                        <div className="bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/50">
                          {entry.label}
                        </div>
                        <ul className="divide-y divide-white/5">
                          {entry.units.map((unit) => (
                            <li key={unit._id} className="px-4 py-3 flex flex-col gap-1">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm text-white font-semibold" style={{ letterSpacing: '-0.01em' }}>{unit.unitName}</p>
                                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">{unit.unitCode}</p>
                                </div>
                                <span className="text-xs text-white/50 whitespace-nowrap">
                                  {unit.creditHours ? `${unit.creditHours} CH` : unit.isCore ? 'Core' : 'Elective'}
                                </span>
                              </div>
                              {unit.description && (
                                <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{unit.description}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-white/50">
                      We don’t have unit information for this programme yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-effect px-6 py-5 rounded-2xl border border-white/5 pointer-events-auto">
                <h3 className="text-lg font-semibold text-white mb-4" style={{ letterSpacing: '-0.01em' }}>Today’s Momentum</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Your Egerton AI companion keeps an eye on your flow. When you’re ready, ask for a study sequence,
                  practice quiz or mnemonic tailored to <span className="text-egerton-green font-semibold">{courseName}</span>.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">Focus streak</p>
                    <p className="text-2xl text-white font-semibold mt-2" style={{ letterSpacing: '-0.02em' }}>3 days</p>
                    <p className="text-xs text-white/50 mt-1">Let’s push it to 4</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">Next check-in</p>
                    <p className="text-2xl text-white font-semibold mt-2" style={{ letterSpacing: '-0.02em' }}>Tomorrow</p>
                    <p className="text-xs text-white/50 mt-1">AI will suggest a revision sprint</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">Motivation</p>
                    <p className="text-sm text-white/70 mt-2">“Every {currentPeriodLabel.toLowerCase()} conquered is a step toward the gown.”</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">Quick actions</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <button className="px-3 py-1 rounded-full border border-egerton-green/40 text-egerton-green hover:bg-egerton-green/20 transition-colors">AI Tutor</button>
                      <button className="px-3 py-1 rounded-full border border-egerton-gold/40 text-egerton-gold hover:bg-egerton-gold/20 transition-colors">Predict Exam</button>
                      <button className="px-3 py-1 rounded-full border border-white/20 text-white/80 hover:bg-white/10 transition-colors">Create Mnemonic</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass-effect p-4 rounded-xl text-center pointer-events-auto cursor-pointer"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`text-sm font-semibold text-${color} mb-1`}>{label}</div>
      <div className="text-lg text-white/80 font-medium" style={{ letterSpacing: '-0.01em' }}>{value}</div>
    </motion.div>
  );
}
