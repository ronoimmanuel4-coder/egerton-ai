import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { authAPI, institutionAPI, courseAPI } from '../lib/api';

export default function Auth() {
  const navigate = useNavigate();
  const { setUser, setToken } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState('login');
  
  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    setError('');

    try {
      const { data } = await authAPI.login(email, password);
      setUser(data.user);
      setToken(data.token);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignup = async (payload) => {
    setLoading(true);
    setError('');
    
    try {
      const { data } = await authAPI.register(payload);
      setUser(data.user);
      setToken(data.token);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Signup failed';
      setError(message);
      setLoading(false);
    }
  };
  
  const handleGuestMode = () => {
    setLoading(true);
    setTimeout(() => {
      setUser({ name: 'Guest', email: 'guest@example.com' });
      setToken('guest-token');
      navigate('/dashboard');
    }, 1500);
  };
  
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Minimal Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center"
        >
          <h1 className="text-2xl font-black text-white tracking-tight">
            Egerton<span className="text-[#00a651]">.</span>
          </h1>
          <button
            onClick={() => navigate('/')}
            className="text-white text-sm uppercase tracking-widest"
          >
            Back Home
          </button>
        </motion.header>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-8 py-24">
          <div className="w-full max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-16"
            >
              <h2 className="text-[clamp(3rem,10vw,9rem)] font-black text-white leading-none mb-8" style={{ letterSpacing: '-0.02em' }}>
                W E L C O M E
              </h2>
              <p className="text-xl md:text-2xl text-white/60 font-light tracking-wide" style={{ letterSpacing: '0.5em' }}>
                T O  E G E R T O N  A I
              </p>
            </motion.div>

            {/* Auth Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-md mx-auto"
            >
              <div className="flex gap-4 mb-8 border-b border-white/10">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`pb-4 text-sm uppercase tracking-widest transition-colors ${
                    authMode === 'login' ? 'text-[#00a651] border-b-2 border-[#00a651]' : 'text-white/40'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`pb-4 text-sm uppercase tracking-widest transition-colors ${
                    authMode === 'signup' ? 'text-[#d2ac67] border-b-2 border-[#d2ac67]' : 'text-white/40'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setAuthMode('guest')}
                  className={`pb-4 text-sm uppercase tracking-widest transition-colors ${
                    authMode === 'guest' ? 'text-[#ed1c24] border-b-2 border-[#ed1c24]' : 'text-white/40'
                  }`}
                >
                  Guest
                </button>
              </div>

              <AnimatePresence mode="wait">
                {authMode === 'login' && (
                  <LoginForm key="login" onSubmit={handleLogin} loading={loading} />
                )}
                {authMode === 'signup' && (
                  <SignupForm key="signup" onSubmit={handleSignup} loading={loading} />
                )}
                {authMode === 'guest' && (
                  <GuestForm key="guest" onSubmit={handleGuestMode} loading={loading} />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pb-8 text-center"
        >
          <p className="text-white/30 text-sm uppercase tracking-widest">
            Sic Donec — Egerton University
          </p>
        </motion.footer>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-2 border-[#00a651] border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-white text-sm uppercase tracking-widest">Authenticating</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-[#ed1c24] px-6 py-3 flex items-center gap-3">
              <span className="text-xl">⚠</span>
              <p className="text-white text-sm">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-2 text-white text-xl"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Login Form Component
function LoginForm({ onSubmit, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#00a651] transition-colors text-sm"
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-0 py-3 bg-transparent border-0 border-b border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#00a651] transition-colors text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#00a651] text-black font-bold text-sm uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? 'Authenticating...' : 'Enter →'}
      </button>
    </motion.form>
  );
}

// Signup Form Component
function SignupForm({ onSubmit, loading }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [studyPeriodNumber, setStudyPeriodNumber] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [subcourse, setSubcourse] = useState('');
  const [errors, setErrors] = useState({});
  const [loadingLookups, setLoadingLookups] = useState({ courses: false });

  const deriveTotalPeriods = (courseData) => {
    if (!courseData) {
      return null;
    }

    const { duration = {} } = courseData;
    const storedTerms = Number.isInteger(duration.terms) ? duration.terms : null;
    if (storedTerms && storedTerms > 0) {
      return storedTerms;
    }

    const storedSemesters = Number.isInteger(duration.semesters) ? duration.semesters : null;
    if (storedSemesters && storedSemesters > 0) {
      return storedSemesters;
    }

    const years = Number.isInteger(duration.years) ? duration.years : null;
    if (years && years > 0) {
      const multiplier = courseData.scheduleType === 'terms' ? 3 : 2;
      return years * multiplier;
    }

    return null;
  };

  const derivePeriodsPerYear = (courseData, totalPeriods) => {
    if (!courseData?.duration || !totalPeriods) {
      return null;
    }

    const years = Number.isInteger(courseData.duration.years) ? courseData.duration.years : null;
    if (!years || years <= 0) {
      return null;
    }

    return Math.max(1, Math.round(totalPeriods / years));
  };

  const deriveMaxYears = (courseData, totalPeriods) => {
    if (!courseData) {
      return null;
    }

    const explicitYears = Number.isInteger(courseData?.duration?.years) ? courseData.duration.years : null;
    if (explicitYears && explicitYears > 0) {
      return explicitYears;
    }

    const total = Number.isInteger(totalPeriods) ? totalPeriods : deriveTotalPeriods(courseData);
    if (total && total > 0) {
      const schedule = courseData.scheduleType === 'terms' ? 'terms' : 'semesters';
      const assumedPerYear = schedule === 'terms' ? 3 : 2;
      return Math.max(1, Math.round(total / assumedPerYear));
    }

    return null;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchInstitutions = async () => {
      try {
        const { data } = await institutionAPI.getAll();
        if (isMounted) {
          const institutionsList = data.institutions || [];
          const egerton = institutionsList.find((inst) => inst.shortName === 'EGERTON') || institutionsList[0];

          if (egerton?._id) {
            setInstitution((current) => current || egerton._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch institutions', err);
        if (isMounted) {
          setInstitution('');
        }
      }
    };

    fetchInstitutions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCourses = async () => {
      if (!institution) {
        setCourses([]);
        return;
      }

      setLoadingLookups((prev) => ({ ...prev, courses: true }));
      try {
        const { data } = await courseAPI.getByInstitution(institution);
        if (isMounted) {
          setCourses(data.courses || []);
        }
      } catch (err) {
        console.error('Failed to fetch courses', err);
        if (isMounted) {
          setCourses([]);
        }
      } finally {
        if (isMounted) {
          setLoadingLookups((prev) => ({ ...prev, courses: false }));
        }
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, [institution]);

  useEffect(() => {
    if (!course) {
      setSelectedCourse(null);
      setStudyPeriodNumber('');
      setSubcourse('');
      setYearOfStudy('');
      return;
    }

    const matchedCourse = courses.find((item) => item._id === course) || null;
    setSelectedCourse(matchedCourse);

    if (!matchedCourse) {
      setStudyPeriodNumber('');
      setSubcourse('');
      setYearOfStudy('');
    }
  }, [course, courses]);

  useEffect(() => {
    if (!selectedCourse) {
      return;
    }

    const total = deriveTotalPeriods(selectedCourse);
    const perYear = derivePeriodsPerYear(selectedCourse, total);
    const limit = perYear || total;
    const maxYears = deriveMaxYears(selectedCourse, total);

    if (limit && Number(studyPeriodNumber) > limit) {
      setStudyPeriodNumber('');
    }

    if (maxYears && Number(yearOfStudy) > maxYears) {
      setYearOfStudy('');
    }
  }, [selectedCourse, studyPeriodNumber, yearOfStudy]);

  useEffect(() => {
    if (!selectedCourse?.subcourses?.length) {
      setSubcourse('');
      return;
    }

    if (!selectedCourse.subcourses.includes(subcourse)) {
      setSubcourse('');
    }
  }, [selectedCourse]);

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');

    if (digits.startsWith('2547') && digits.length === 12) {
      return `+${digits}`;
    }

    if (digits.startsWith('07') && digits.length === 10) {
      return `+254${digits.slice(1)}`;
    }

    if (digits.startsWith('7') && digits.length === 9) {
      return `+254${digits}`;
    }

    return value;
  };

  const validate = () => {
    const newErrors = {};
    const courseDetails = selectedCourse;
    const periodLabel = courseDetails?.scheduleType === 'terms' ? 'Term' : 'Semester';
    const expectedType = courseDetails?.scheduleType === 'terms' ? 'term' : 'semester';
    const totalPeriods = deriveTotalPeriods(courseDetails);
    const periodsPerYear = derivePeriodsPerYear(courseDetails, totalPeriods);
    const maxYears = deriveMaxYears(courseDetails, totalPeriods) ?? 6;
    const maxPeriods = periodsPerYear
      ?? totalPeriods
      ?? (Number.isInteger(courseDetails?.duration?.years)
        ? courseDetails.duration.years * (courseDetails?.scheduleType === 'terms' ? 3 : 2)
        : 6);

    if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters.';
    }

    if (lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters.';
    }

    if (!email) {
      newErrors.email = 'Email is required.';
    }

    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!/^\+2547\d{8}$/.test(formattedPhone)) {
      newErrors.phoneNumber = 'Phone number must be a valid Kenyan number, e.g. +2547XXXXXXXX.';
    }

    const yearInt = parseInt(yearOfStudy, 10);
    if (Number.isNaN(yearInt) || yearInt < 1 || yearInt > maxYears) {
      newErrors.yearOfStudy = `Year of study must be between 1 and ${maxYears}.`;
    }

    let periodInt = null;
    if (!institution) {
      newErrors.course = 'Unable to detect Egerton automatically. Please refresh and try again.';
    } else if (course && !courseDetails) {
      newErrors.course = 'We could not load details for this course. Please re-select it.';
    } else if (courseDetails && totalPeriods === null) {
      newErrors.course = 'Course schedule information is unavailable. Please try another program or contact support.';
    }

    if (courseDetails?.subcourses?.length) {
      if (!subcourse) {
        newErrors.subcourse = 'Select your specialization for this course.';
      } else if (!courseDetails.subcourses.includes(subcourse)) {
        newErrors.subcourse = 'Selected specialization is not valid for this course.';
      }
    }

    if (courseDetails) {
      periodInt = parseInt(studyPeriodNumber, 10);
      if (Number.isNaN(periodInt)) {
        newErrors.studyPeriodNumber = `Select your current ${periodLabel.toLowerCase()}.`;
      } else if (periodInt < 1 || periodInt > maxPeriods) {
        newErrors.studyPeriodNumber = `${periodLabel} must be between 1 and ${maxPeriods}.`;
      }
    }

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      formattedPhone,
      yearInt,
      studyPeriodType: expectedType,
      periodInt,
      maxYears,
      maxPeriods,
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid, formattedPhone, yearInt, studyPeriodType, periodInt } = validate();

    if (!isValid) {
      return;
    }

    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      phoneNumber: formattedPhone,
      institution,
      course,
      subcourse: subcourse || undefined,
      yearOfStudy: yearInt,
      studyPeriod: {
        type: studyPeriodType,
        number: periodInt,
      },
    });
  };

  const periodLabel = selectedCourse?.scheduleType === 'terms' ? 'Term' : 'Semester';
  const totalPeriods = deriveTotalPeriods(selectedCourse);
  const periodsPerYear = derivePeriodsPerYear(selectedCourse, totalPeriods);
  const maxYearsForCourse = selectedCourse ? (deriveMaxYears(selectedCourse, totalPeriods) ?? 6) : null;
  const displayYears = selectedCourse
    ? (Number.isInteger(selectedCourse?.duration?.years)
      ? selectedCourse.duration.years
      : maxYearsForCourse ?? '—')
    : '—';
  const periodOptionsCount = periodsPerYear || totalPeriods || 0;
  const periodPlaceholder = periodOptionsCount
    ? `Select your current ${periodLabel.toLowerCase()} (1 - ${periodOptionsCount})`
    : `Select your current ${periodLabel.toLowerCase()}`;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Personalize Your Journey</p>
        <p className="text-white/70 text-sm font-light leading-relaxed">
          Tell us about your current studies at Egerton so your AI companion greets you with the right insights every time you log in.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`w-full px-0 py-3 bg-transparent border-0 border-b ${errors.firstName ? 'border-[#ed1c24]' : 'border-white/20'} text-white placeholder-white/40 focus:outline-none focus:border-[#d2ac67] transition-colors text-sm`}
          />
          {errors.firstName && (
            <p className="mt-2 text-xs text-[#ed1c24] uppercase tracking-wide">{errors.firstName}</p>
          )}
        </div>
        <div>
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`w-full px-0 py-3 bg-transparent border-0 border-b ${errors.lastName ? 'border-[#ed1c24]' : 'border-white/20'} text-white placeholder-white/40 focus:outline-none focus:border-[#d2ac67] transition-colors text-sm`}
          />
          {errors.lastName && (
            <p className="mt-2 text-xs text-[#ed1c24] uppercase tracking-wide">{errors.lastName}</p>
          )}
        </div>
      </div>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-0 py-3 bg-transparent border-0 border-b ${errors.email ? 'border-[#ed1c24]' : 'border-white/20'} text-white placeholder-white/40 focus:outline-none focus:border-[#d2ac67] transition-colors text-sm`}
        />
        {errors.email && (
          <p className="mt-2 text-xs text-[#ed1c24] uppercase tracking-wide">{errors.email}</p>
        )}
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-0 py-3 bg-transparent border-0 border-b ${errors.password ? 'border-[#ed1c24]' : 'border-white/20'} text-white placeholder-white/40 focus:outline-none focus:border-[#d2ac67] transition-colors text-sm`}
        />
        {errors.password && (
          <p className="mt-2 text-xs text-[#ed1c24] uppercase tracking-wide">{errors.password}</p>
        )}
      </div>
      <div>
        <input
          type="tel"
          placeholder="Phone Number (+2547...)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className={`w-full px-0 py-3 bg-transparent border-0 border-b ${errors.phoneNumber ? 'border-[#ed1c24]' : 'border-white/20'} text-white placeholder-white/40 focus:outline-none focus:border-[#d2ac67] transition-colors text-sm`}
        />
        {errors.phoneNumber && (
          <p className="mt-2 text-xs text-[#ed1c24] uppercase tracking-wide">{errors.phoneNumber}</p>
        )}
      </div>
      <div>
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          disabled={!institution || loadingLookups.courses}
          className={`w-full px-0 py-3 bg-transparent border-0 border-b ${errors.course ? 'border-[#ed1c24]' : 'border-white/20'} text-white focus:outline-none focus:border-[#d2ac67] transition-colors text-sm appearance-none ${!institution ? 'text-white/40' : ''}`}
        >
          <option value="" className="bg-black text-white">
            {institution ? (loadingLookups.courses ? 'Loading Egerton courses...' : 'Select Your Course') : 'Linking to Egerton...'}
          </option>
          {courses.map((item) => (
            <option key={item._id} value={item._id} className="bg-black text-white">
              {item.name}
            </option>
          ))}
        </select>
        {errors.course && (
          <p className="mt-2 text-xs text-[#ed1c24] uppercase tracking-wide">{errors.course}</p>
        )}
      </div>
      {selectedCourse?.subcourses?.length > 0 && (
        <div>
          <select
            value={subcourse}
            onChange={(e) => setSubcourse(e.target.value)}
            className={`w-full px-0 py-3 bg-transparent border-0 border-b ${errors.subcourse ? 'border-[#ed1c24]' : 'border-white/20'} text-white focus:outline-none focus:border-[#d2ac67] transition-colors text-sm appearance-none`}
          >
            <option value="" className="bg-black text-white">Select specialization / track</option>
            {selectedCourse.subcourses.map((item) => (
              <option key={item} value={item} className="bg-black text-white">
                {item}
              </option>
            ))}
          </select>
          {errors.subcourse && (
            <p className="mt-2 text-xs text-[#ed1c24] uppercase tracking-wide">{errors.subcourse}</p>
          )}
        </div>
      )}
      <div>
        <select
          value={yearOfStudy}
          onChange={(e) => setYearOfStudy(e.target.value)}
          disabled={!selectedCourse || !maxYearsForCourse}
          className={`w-full px-0 py-3 bg-transparent border-0 border-b ${errors.yearOfStudy ? 'border-[#ed1c24]' : 'border-white/20'} text-white focus:outline-none focus:border-[#d2ac67] transition-colors text-sm appearance-none`}
        >
          <option value="" className="bg-black text-white">
            {selectedCourse
              ? maxYearsForCourse
                ? `Select Year of Study (1 - ${maxYearsForCourse})`
                : 'Select Year of Study'
              : 'Select your course first'}
          </option>
          {selectedCourse && maxYearsForCourse && (
            Array.from({ length: maxYearsForCourse }, (_, idx) => idx + 1).map((year) => (
              <option key={year} value={year} className="bg-black text-white">
                Year {year}
              </option>
            ))
          )}
        </select>
        {errors.yearOfStudy && (
          <p className="mt-2 text-xs text-[#ed1c24] uppercase tracking-wide">{errors.yearOfStudy}</p>
        )}
      </div>
      {selectedCourse && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Current {periodLabel}</p>
            <p className="text-[11px] text-white/40 uppercase tracking-widest">
              {periodLabel}s This Year: {periodsPerYear ?? '—'}
            </p>
          </div>
          <select
            value={studyPeriodNumber}
            onChange={(e) => setStudyPeriodNumber(e.target.value)}
            className={`w-full px-0 py-3 bg-transparent border-0 border-b ${errors.studyPeriodNumber ? 'border-[#ed1c24]' : 'border-white/20'} text-white focus:outline-none focus:border-[#d2ac67] transition-colors text-sm appearance-none`}
          >
            <option value="" className="bg-black text-white">{periodPlaceholder}</option>
            {periodOptionsCount > 0 &&
              Array.from({ length: periodOptionsCount }, (_, idx) => idx + 1).map((value) => (
                <option key={value} value={value} className="bg-black text-white">
                  {periodLabel} {value}
                </option>
              ))}
          </select>
          {errors.studyPeriodNumber && (
            <p className="mt-2 text-xs text-[#ed1c24] uppercase tracking-wide">{errors.studyPeriodNumber}</p>
          )}
        </div>
      )}
      {selectedCourse && (
        <div className="border border-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">Your Course Capsule</p>
          <p className="text-white text-sm font-medium" style={{ letterSpacing: '-0.01em' }}>{selectedCourse.name}</p>
          <p className="text-white/50 text-xs mt-2" style={{ letterSpacing: '0.2em' }}>
            {selectedCourse.scheduleType === 'terms' ? 'Terms' : 'Semesters'} • {displayYears} Years • {totalPeriods ?? '—'} {periodLabel}s
          </p>
          {periodsPerYear && (
            <p className="text-white/40 text-[11px] mt-1" style={{ letterSpacing: '0.2em' }}>
              ~{periodsPerYear} {periodLabel.toLowerCase()}(s) per academic year
            </p>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#d2ac67] text-black font-bold text-sm uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Account →'}
      </button>
    </motion.form>
  );
}

// Guest Form Component
function GuestForm({ onSubmit, loading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="text-center py-8">
        <p className="text-white/60 text-sm mb-2">Quick access to AI chat</p>
        <p className="text-white/40 text-xs">No account required</p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#ed1c24] text-white font-bold text-sm uppercase tracking-widest disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Continue as Guest →'}
      </button>
    </motion.form>
  );
}
