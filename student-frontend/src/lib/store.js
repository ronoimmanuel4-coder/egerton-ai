import { create } from 'zustand';

const defaultAcademicSnapshot = {
  loading: false,
  error: null,
  course: null,
  courseInfo: null,
  year: null,
  subcourse: null,
  periodNumber: null,
  periodLabel: 'Semester',
  rawUnitsByPeriod: {},
  unitsByPeriod: {},
  unitsForPeriod: [],
};

const getNormalizedKey = (key) => {
  const numeric = Number(key);
  return Number.isNaN(numeric) ? key : numeric;
};

const filterUnitsBySubcourse = (rawUnits = {}, subcourse) => {
  if (!rawUnits) {
    return {};
  }

  return Object.entries(rawUnits).reduce((acc, [key, units]) => {
    const normalizedKey = getNormalizedKey(key);
    const safeUnits = Array.isArray(units) ? units : [];

    const filtered = subcourse
      ? safeUnits.filter((unit) => {
          const unitSubcourse = unit?.subcourse?.trim();
          if (!unitSubcourse) {
            return true;
          }
          return unitSubcourse === subcourse;
        })
      : safeUnits;

    acc[normalizedKey] = filtered;
    return acc;
  }, {});
};

const deriveUnitsForPeriod = (unitsByPeriod = {}, periodNumber) => {
  if (!periodNumber) {
    return [];
  }

  return unitsByPeriod[periodNumber]
    || unitsByPeriod[String(periodNumber)]
    || [];
};

export const useStore = create((set) => ({
  // User state
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  userAcademic: { ...defaultAcademicSnapshot },
  
  // UI state
  isLoading: false,
  darkMode: true,
  isMobile: window.innerWidth < 768,
  showEasterEgg: false,
  lionClickCount: 0,
  
  // 3D state
  webGLSupported: true,
  use3DFallback: false,
  mousePosition: { x: 0, y: 0 },
  
  // Voice command state
  isListening: false,
  voiceActive: false,
  
  // Actions
  setUser: (user) => set(() => {
    if (!user) {
      return {
        user: null,
        isAuthenticated: false,
        userAcademic: { ...defaultAcademicSnapshot },
      };
    }

    const periodType = user?.studyPeriod?.type === 'term' ? 'Term' : 'Semester';
    const rawPeriodNumber = user?.studyPeriod?.number;
    const periodNumber = rawPeriodNumber !== undefined && rawPeriodNumber !== null && !Number.isNaN(Number(rawPeriodNumber))
      ? Number(rawPeriodNumber)
      : null;

    return {
      user,
      isAuthenticated: true,
      userAcademic: {
        ...defaultAcademicSnapshot,
        course: user.course || null,
        year: user.yearOfStudy || null,
        subcourse: user.subcourse || null,
        periodNumber,
        periodLabel: periodType,
      },
    };
  }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      userAcademic: { ...defaultAcademicSnapshot },
    });
  },
  setLoading: (isLoading) => set({ isLoading }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setIsMobile: (isMobile) => set({ isMobile }),
  setWebGLSupported: (supported) => set({ 
    webGLSupported: supported,
    use3DFallback: !supported 
  }),
  setMousePosition: (x, y) => set({ mousePosition: { x, y } }),
  setVoiceActive: (active) => set({ voiceActive: active }),
  setIsListening: (listening) => set({ isListening: listening }),
  setUserAcademic: (partial) => set((state) => ({
    userAcademic: (() => {
      const previous = state.userAcademic;
      const rawUnits = partial.rawUnitsByPeriod !== undefined
        ? partial.rawUnitsByPeriod
        : previous.rawUnitsByPeriod;
      const subcourse = partial.subcourse !== undefined
        ? partial.subcourse
        : previous.subcourse;
      const periodNumber = partial.periodNumber !== undefined
        ? partial.periodNumber
        : previous.periodNumber;

      const unitsByPeriod = partial.unitsByPeriod !== undefined
        ? partial.unitsByPeriod
        : filterUnitsBySubcourse(rawUnits, subcourse);

      const unitsForPeriod = partial.unitsForPeriod !== undefined
        ? partial.unitsForPeriod
        : deriveUnitsForPeriod(unitsByPeriod, periodNumber);

      return {
        ...previous,
        ...partial,
        rawUnitsByPeriod: rawUnits,
        subcourse,
        periodNumber,
        unitsByPeriod,
        unitsForPeriod,
      };
    })(),
  })),
  resetUserAcademic: () => set({ userAcademic: { ...defaultAcademicSnapshot } }),
  incrementLionClick: () => set((state) => {
    const newCount = state.lionClickCount + 1;
    return {
      lionClickCount: newCount,
      showEasterEgg: newCount >= 3
    };
  }),
  resetLionClick: () => set({ lionClickCount: 0, showEasterEgg: false }),
}));
