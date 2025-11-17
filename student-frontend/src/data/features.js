export const features = [
  {
    slug: 'ai-tutor',
    icon: '🤖',
    title: 'AI Tutor',
    color: 'egerton-green',
    summary: '24/7 intelligent assistant tailored to Egerton coursework.',
    description: `Egerton AI Tutor gives you instant help with your assignments, labs, and revision questions.
It understands faculty-specific terminology, can simplify complex theories, and even generates step-by-step worked solutions.
Use it to brainstorm, ask follow-up questions, and practice viva-style explanations.`,
    highlights: [
      'Understands Egerton lecture notes and course outlines',
      'Supports text, voice, and follow-up conversational context',
      'Explains answers with diagrams, examples, and citations',
      'Switch between concise, exam, or storytelling explanation styles',
    ],
    metrics: [
      { label: 'Average response time', value: '1.2s' },
      { label: 'Knowledge base updates', value: 'Weekly' },
      { label: 'Supported departments', value: '15+' },
    ],
    workflow: [
      'Open the tutor panel from the AI Dashboard',
      'Upload or paste your question / screenshot',
      'Pick tone (concise / detailed) and click Ask',
      'Receive instant response with follow-up suggestions',
    ],
  },
  {
    slug: 'smart-analytics',
    icon: '📊',
    title: 'Smart Analytics',
    color: 'egerton-gold',
    summary: 'Personalized dashboards that track academic progress.',
    description: `Stay on top of your academic performance with analytics tuned for Egerton grading policies.
Spot weak areas early, benchmark against classmates, and receive nudges before deadlines.`,
    highlights: [
      'Real-time GPA projections and grade simulations',
      'Topic heatmaps generated from quiz & assignment scores',
      'Deadline tracker with proactive reminders',
      'Integrates with timetable, calendar, and study planner',
    ],
    metrics: [
      { label: 'Improvement alerts sent', value: '4.8K+' },
      { label: 'Average grade lift', value: '+12%' },
      { label: 'Data refresh', value: 'Every 10 mins' },
    ],
    workflow: [
      'Connect your LMS and timetable accounts',
      "Review the Progress Ring panel on the dashboard",
      'Focus revision using recommended weak spots',
      'Receive weekly performance digest emails',
    ],
  },
  {
    slug: 'exam-prediction',
    icon: '🎯',
    title: 'Exam Prediction',
    color: 'egerton-red',
    summary: 'AI forecasts the most likely exam topics and questions.',
    description: `Egerton AI analyzes past papers, lecturer patterns, and current syllabus coverage to forecast exam focus.
Use it as a targeted revision guide, not a shortcut, with weekly updates during exam season.`,
    highlights: [
      'Lecturer-specific weighting models trained on past 8 years',
      'Priority ranking of chapters, labs, and practicals',
      'Suggested essay outlines and marking scheme rubrics',
      'Confidence scores with reasoning transparency',
    ],
    metrics: [
      { label: 'Prediction accuracy', value: '87%' },
      { label: 'Past papers analyzed', value: '1,200+' },
      { label: 'Update frequency', value: 'Daily in exam season' },
    ],
    workflow: [
      'Select your unit and lecturer',
      'Review top predicted topics and question types',
      'Download suggested revision pack',
      'Practice with adaptive quizzes that mimic forecast',
    ],
  },
  {
    slug: 'resource-hub',
    icon: '📚',
    title: 'Resource Hub',
    color: 'egerton-dark-green',
    summary: 'Curated digital library for all faculties at Egerton.',
    description: `Quickly locate course texts, recorded lectures, tutorials, and lab manuals.
Resources are tagged by faculty, year, and difficulty with AI-assisted search.`,
    highlights: [
      'Smart search with semantic understanding',
      'Offline-ready downloads with license tracking',
      'Faculty-approved reading lists and lab guides',
      'Student community uploads with moderation',
    ],
    metrics: [
      { label: 'Resources indexed', value: '18K+' },
      { label: 'Average search time', value: '0.8s' },
      { label: 'Daily downloads', value: '3.2K' },
    ],
    workflow: [
      'Search by keyword, unit code, or lecturer',
      'Filter results by format, difficulty, or recency',
      'Preview summaries with AI-generated highlights',
      'Download or pin to personal study shelf',
    ],
  },
  {
    slug: 'study-planner',
    icon: '📅',
    title: 'Study Planner',
    color: 'egerton-green',
    summary: 'Adaptive scheduling that respects your real-life rhythm.',
    description: `Plan revision, assignments, and group work with a planner that auto-adjusts to your pace.
It syncs with the university timetable, bus schedule, and personal commitments.`,
    highlights: [
      'Drag-and-drop tasks with priority scoring',
      'Auto-reschedule when you fall behind',
      'Reminders via SMS, email, and push notifications',
      'Weekly retrospectives with productivity insights',
    ],
    metrics: [
      { label: 'Tasks scheduled', value: '52K+' },
      { label: 'On-time completion rate', value: '76%' },
      { label: 'Sync integrations', value: 'Google, Outlook, iCal' },
    ],
    workflow: [
      'Import course timetable and personal events',
      'Create study blocks with AI-suggested durations',
      'Receive nudges before deadlines or clashes',
      'Reflect with weekly recap and adjust goals',
    ],
  },
  {
    slug: 'custom-mnemonics',
    icon: '🧠',
    title: 'Custom Mnemonics',
    color: 'egerton-gold',
    summary: 'Memory aids generated to match your learning style.',
    description: `Whether you love music, storytelling, or visual cues, the AI generates tailored mnemonics.
Perfect for anatomy lists, soil classifications, legal cases, or formula-heavy courses.`,
    highlights: [
      'Supports visual, auditory, and kinesthetic styles',
      'Exports to flashcards and printable sheets',
      'Group mode for collaborative mnemonic creation',
      'Spaced repetition reminders built-in',
    ],
    metrics: [
      { label: 'Mnemonics generated', value: '9.4K' },
      { label: 'Average recall boost', value: '+28%' },
      { label: 'Supported languages', value: '3 (Eng, Swahili, Maasai)' },
    ],
    workflow: [
      'Select topic and preferred learning style',
      'AI suggests multiple mnemonic options',
      'Customize wording, imagery, or rhythm',
      'Add to spaced repetition deck',
    ],
  },
  {
    slug: 'study-groups',
    icon: '👥',
    title: 'Study Groups',
    color: 'egerton-red',
    summary: 'Find or host collaborative sessions with classmates.',
    description: `Create focused study pods with classmates preparing for the same exam or project.
Share resources, whiteboards, and host discussions with AI summaries.`,
    highlights: [
      'AI-matched peers by unit, availability, and goals',
      'Built-in Pomodoro and agenda templates',
      'Automatic meeting notes and action items',
      'Secure guest access for lecturers or tutors',
    ],
    metrics: [
      { label: 'Active study pods', value: '640+' },
      { label: 'Average session rating', value: '4.6/5' },
      { label: 'Recurring sessions', value: '68%' },
    ],
    workflow: [
      'Browse recommended study pods or create your own',
      'Set agenda, goals, and resource list',
      'Meet virtually with shared whiteboards and AI notes',
      'Review highlights and assign next steps',
    ],
  },
  {
    slug: 'voice-commands',
    icon: '🎤',
    title: 'Voice Commands',
    color: 'egerton-dark-green',
    summary: 'Hands-free control for quick interactions.',
    description: `Say “Hey Egerton AI” to start navigating the entire platform with voice.
Designed for accessibility and convenience during labs or while on the move.`,
    highlights: [
      'Supports English and Swahili intents',
      'Voice confirmations, dictation, and read-aloud responses',
      'Works offline with cached commands',
      'Privacy-first: all voice data processed locally when possible',
    ],
    metrics: [
      { label: 'Command latency', value: 'Sub-400ms' },
      { label: 'Available intents', value: '120+' },
      { label: 'Daily active voice users', value: '2.1K' },
    ],
    workflow: [
      'Enable microphone access and say “Hey Egerton AI”',
      'Issue commands like “Open planner” or “Summarize chapter 4”',
      'Confirm or refine using short voice prompts',
      'Review action history in the voice activity log',
    ],
  },
  {
    slug: 'progress-tracking',
    icon: '📈',
    title: 'Progress Tracking',
    color: 'egerton-green',
    summary: 'Celebrate milestones with motivating visualisations.',
    description: `Watch your dedication pay off through dynamic progress rings, badges, and learning streaks.
All metrics are grounded in Egerton assessment policies and attendance records.`,
    highlights: [
      'Adaptive milestones per faculty and year of study',
      'Weekly mood check-ins with supportive nudges',
      'Sharable achievements with privacy controls',
      'Integrates with Fitness+ and Habits trackers',
    ],
    metrics: [
      { label: 'Milestones unlocked', value: '12.7K' },
      { label: 'Active streaks >14 days', value: '3.4K' },
      { label: 'Motivation boosts sent', value: '22K/month' },
    ],
    workflow: [
      'Sync attendance and coursework to seed baseline',
      'Set term goals and personal rewards',
      'Earn streaks, badges, and encouragements',
      'Share highlight reel with mentors or peers',
    ],
  },
];

export const featureMap = Object.fromEntries(features.map((feature) => [feature.slug, feature]));
