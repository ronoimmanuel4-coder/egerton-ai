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
  const [showSidebar, setShowSidebar] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Collapse sidebar on small screens and update on resize
  useEffect(() => {
    const onResize = () => {
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      setShowSidebar(isDesktop);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const firstName = useMemo(() => {
    if (!user) return 'Friend';
    if (user.firstName) return user.firstName;
    if (user.name) return user.name.split(' ')[0];
    return 'Friend';
  }, [user]);

  const courseName = userAcademic.courseInfo?.name || user?.course?.name || 'Your Programme';
  const studyYear = userAcademic.year || user?.yearOfStudy || 1;
  const currentPeriodLabel = userAcademic.periodLabel || 'Semester';

  // Load units
  useEffect(() => {
    if (!isAuthenticated || !user || hasFetchedUnitsRef.current) return;

    const rawCourse = user.course;
    const rawYear = user.yearOfStudy;

    if (!rawCourse || rawYear == null) return;

    const courseId = typeof rawCourse === 'string' ? rawCourse : rawCourse?._id;
    const yearNumber = Number(rawYear);

    if (!courseId || Number.isNaN(yearNumber)) return;

    hasFetchedUnitsRef.current = true;

    const loadUnits = async () => {
      setUnitsLoading(true);
      try {
        const { data } = await courseAPI.getUnitsForYear(courseId, yearNumber);
        if (!isMountedRef.current) return;

        const units = data?.units || {};
        setUnitsByPeriod(units);
        
        const keys = Object.keys(units);
        if (keys.length > 0) {
          setCurrentPeriod(Number.isNaN(Number(keys[0])) ? keys[0] : Number(keys[0]));
        }
        
        setUnitsLoading(false);
        setUserAcademic({
          loading: false,
          rawUnitsByPeriod: units,
          courseInfo: data?.course || null,
          course: courseId,
          year: yearNumber,
        });
      } catch (error) {
        console.error('Failed to load units:', error);
        setUnitsLoading(false);
      }
    };

    loadUnits();
  }, [isAuthenticated, user, setUserAcademic]);

  const currentUnits = useMemo(() => {
    if (!currentPeriod || !unitsByPeriod) return [];
    return unitsByPeriod[currentPeriod] || unitsByPeriod[String(currentPeriod)] || [];
  }, [unitsByPeriod, currentPeriod]);

  // Initial AI greeting
  useEffect(() => {
    if (!user || messages.length > 0) return;
    
    const greeting = {
      id: Date.now(),
      sender: 'ai',
      text: `Hey ${firstName}! 👋 I'm your personal AI study companion, here to make your learning journey smooth and enjoyable. Whether you need help understanding a topic, want to create study materials, or just need some motivation - I've got your back!`,
      timestamp: new Date(),
    };

    setMessages([greeting]);
  }, [user, firstName]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call the real AI backend
      const response = await courseAPI.getAll(); // Using existing api setup
      const aiResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: text.trim() }),
      });

      const data = await aiResponse.json();

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.message || data.response || generateAIResponse(text.trim().toLowerCase()),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      // Fallback to simulated response if API fails
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: generateAIResponse(text.trim().toLowerCase()),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userText) => {
    if (userText.includes('help') || userText.includes('stuck')) {
      return `I'm here to help! ${firstName}, tell me which topic or concept you're struggling with, and I'll break it down into simple, digestible pieces for you. 📚`;
    }
    if (userText.includes('exam') || userText.includes('test') || userText.includes('quiz')) {
      return `Let's get you exam-ready! I can create practice questions, predict likely topics based on your course pattern, and help you create effective study schedules. What would be most helpful right now? 🎯`;
    }
    if (userText.includes('mnemonic') || userText.includes('remember')) {
      return `Memory tricks are my specialty! Give me the concept or list you need to remember, and I'll create a custom mnemonic that'll stick with you. Your brain will thank you! 🧠✨`;
    }
    if (userText.includes('schedule') || userText.includes('plan')) {
      return `Great thinking! A good study plan makes all the difference. Based on your ${currentUnits.length} units this semester, I can help you create a balanced schedule that fits your life. Want me to draft one? 📅`;
    }
    if (userText.includes('motivat') || userText.includes('tired') || userText.includes('give up')) {
      return `Hey, I see you ${firstName}! 💪 Remember why you started - you're building your future one day at a time. Every small step counts. You've already come so far, and I believe in you. Let's take it one topic at a time, yeah? 🌟`;
    }
    return `That's an interesting question! I'm here to support your ${courseName} journey in Year ${studyYear}. I can help with study materials, exam prep, creating mnemonics, or just being here when you need to talk through concepts. What would you like to explore? 🤔`;
  };

  const suggestedPrompts = [
    { icon: '📝', text: 'Create practice quiz', action: () => handleSendMessage('Create a practice quiz for my current units') },
    { icon: '🧠', text: 'Make me a mnemonic', action: () => handleSendMessage('Help me create mnemonics for key concepts') },
    { icon: '🎯', text: 'Predict exam topics', action: () => handleSendMessage('What topics are likely to appear in my exams?') },
    { icon: '📅', text: 'Plan my study week', action: () => handleSendMessage('Help me create a study schedule for this week') },
    { icon: '💡', text: 'Explain a concept', action: () => handleSendMessage('I need help understanding a difficult concept') },
    { icon: '🏆', text: 'Set a goal', action: () => handleSendMessage('Help me set achievable study goals') },
  ];

  const availablePeriods = useMemo(() => {
    const keys = Object.keys(unitsByPeriod || {});
    return keys.map(key => {
      const numeric = Number(key);
      return Number.isNaN(numeric) ? key : numeric;
    }).sort((a, b) => Number(a) - Number(b));
  }, [unitsByPeriod]);

  const totalUnitsCount = useMemo(() => {
    return Object.values(unitsByPeriod || {}).reduce((sum, units) => sum + units.length, 0);
  }, [unitsByPeriod]);

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-[#0a0118] via-[#000510] to-[#001510]">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-egerton-green/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-egerton-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main container */}
      <div className="relative z-10 flex h-[100svh]">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white text-lg font-semibold">Your Learning Hub</h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-egerton-green/10 border border-egerton-green/30 rounded-xl">
                  <div className="w-10 h-10 bg-egerton-green rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{firstName}</p>
                    <p className="text-xs text-white/60">Year {studyYear} • {currentPeriodLabel} {currentPeriod || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-6 border-b border-white/10">
                <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Your Progress</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-white/70">Total Units</span>
                    <span className="text-lg font-bold text-egerton-green">{totalUnitsCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-white/70">This {currentPeriodLabel}</span>
                    <span className="text-lg font-bold text-egerton-gold">{currentUnits.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-white/70">Study Streak</span>
                    <span className="text-lg font-bold text-egerton-red">3 days 🔥</span>
                  </div>
                </div>
              </div>

              {/* Period Selector */}
              {availablePeriods.length > 0 && (
                <div className="p-6 border-b border-white/10">
                  <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Select {currentPeriodLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {availablePeriods.map(period => (
                      <button
                        key={period}
                        onClick={() => setCurrentPeriod(period)}
                        className={`px-4 py-2 rounded-full text-sm transition-all ${
                          Number(period) === Number(currentPeriod)
                            ? 'bg-egerton-green text-white font-medium'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {currentPeriodLabel} {period}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Units List */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Your Units</p>
                {unitsLoading ? (
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <span className="w-2 h-2 bg-egerton-green rounded-full animate-ping"></span>
                    Loading units...
                  </div>
                ) : currentUnits.length > 0 ? (
                  <div className="space-y-2">
                    {currentUnits.map(unit => (
                      <div
                        key={unit._id}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-egerton-green/40 transition-all cursor-pointer"
                      >
                        <p className="text-sm text-white font-medium">{unit.unitName}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-white/50">{unit.unitCode}</p>
                          <span className="text-xs text-egerton-green">{unit.creditHours} CH</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/50">No units available for this {currentPeriodLabel.toLowerCase()}.</p>
                )}
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-white/10">
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
                >
                  ← Back to Home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!showSidebar && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <span className="text-2xl">☰</span>
                  </button>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Hey {firstName}! <span className="text-3xl">👋</span>
                  </h1>
                  <p className="text-sm text-white/60 mt-1">
                    Your personal AI study companion is ready to help
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-egerton-green rounded-full animate-pulse"></div>
                <span className="text-sm text-white/60">AI Online</span>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-full px-5 py-4 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-egerton-green text-white'
                        : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                    }`}
                  >
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🤖</span>
                        <span className="text-xs text-egerton-green font-semibold uppercase tracking-wide">Egerton AI</span>
                      </div>
                    )}
                    <p className="text-base leading-relaxed">{message.text}</p>
                    <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-white/50'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="max-w-2xl px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-egerton-green rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-egerton-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-egerton-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (show when no messages or just greeting) */}
          {messages.length <= 1 && (
            <div className="px-6 pb-4">
              <p className="text-sm text-white/60 mb-3">Try asking me about:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {suggestedPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={prompt.action}
                    className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-egerton-green/40 rounded-xl transition-all text-left"
                  >
                    <span className="text-2xl">{prompt.icon}</span>
                    <span className="text-sm text-white/80">{prompt.text}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6">
            <div className="max-w-4xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Ask me anything, ${firstName}...`}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-egerton-green/60 focus:bg-white/15 transition-all text-sm sm:text-base"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="px-4 sm:px-8 py-3 sm:py-4 bg-egerton-green hover:bg-egerton-green/90 disabled:bg-white/10 disabled:text-white/40 text-white font-medium rounded-2xl transition-all disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Send
                </button>
              </form>
              <p className="text-xs text-white/40 text-center mt-3">
                Powered by Egerton AI • Your conversations are private and secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
