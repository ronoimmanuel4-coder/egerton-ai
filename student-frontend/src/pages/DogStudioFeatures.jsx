import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function DogStudioFeatures() {
  const navigate = useNavigate();
  
  const features = [
    {
      number: '01',
      title: 'AI Study Partner',
      description: 'Personalized learning assistance powered by advanced artificial intelligence. Get instant answers, explanations, and study guidance 24/7.',
      tech: 'Natural Language Processing',
    },
    {
      number: '02',
      title: 'Smart Analytics',
      description: 'Track your academic progress with intelligent insights and data-driven recommendations. Visualize your learning journey.',
      tech: 'Data Science',
    },
    {
      number: '03',
      title: 'Exam Prediction',
      description: 'AI-powered exam predictions based on lecturer patterns and historical data. Prepare smarter, not harder.',
      tech: 'Machine Learning',
    },
    {
      number: '04',
      title: 'Course Management',
      description: 'Organize your courses, assignments, and deadlines in one centralized platform. Stay on top of your academic responsibilities.',
      tech: 'Education Technology',
    },
    {
      number: '05',
      title: 'Study Groups',
      description: 'Collaborate with peers in AI-facilitated study groups. Share resources, discuss concepts, and learn together.',
      tech: 'Social Learning',
    },
    {
      number: '06',
      title: 'Resource Library',
      description: 'Access a comprehensive library of study materials, past papers, and curated educational content.',
      tech: 'Content Management',
    },
    {
      number: '07',
      title: 'Performance Insights',
      description: 'Understand your strengths and weaknesses with detailed performance analytics and personalized improvement strategies.',
      tech: 'Learning Analytics',
    },
    {
      number: '08',
      title: 'Custom Mnemonics',
      description: 'Generate personalized memory aids and study techniques tailored to your learning style and course content.',
      tech: 'Cognitive Science',
    },
    {
      number: '09',
      title: 'Progress Tracking',
      description: 'Monitor your learning milestones and celebrate achievements with comprehensive progress tracking tools.',
      tech: 'Goal Management',
    },
    {
      number: '10',
      title: 'Mobile Learning',
      description: 'Study anywhere, anytime with our responsive mobile platform. Your learning companion in your pocket.',
      tech: 'Cross-Platform',
    },
  ];
  
  return (
    <div className="bg-black min-h-screen text-white pt-32 px-8 pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-32"
        >
          <h1 
            className="text-[clamp(3rem,10vw,7rem)] font-black leading-none mb-8"
            style={{ letterSpacing: '-0.02em' }}
          >
            Our Features
          </h1>
          <p 
            className="text-xl md:text-2xl text-white/60 font-light max-w-3xl"
            style={{ letterSpacing: '0.05em', lineHeight: '1.8' }}
          >
            We're building the future of education with AI-powered tools designed specifically
            for Egerton University students. Every feature is crafted to enhance your learning experience.
          </p>
        </motion.div>
        
        {/* Features Grid */}
        <div className="space-y-0">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="border-t border-white/10 py-12 grid md:grid-cols-12 gap-8"
            >
              <div className="md:col-span-2">
                <span className="text-[#00a651] text-xl font-light" style={{ letterSpacing: '0.2em' }}>
                  {feature.number}
                </span>
              </div>
              
              <div className="md:col-span-6">
                <h3 
                  className="text-3xl font-bold mb-4"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {feature.title}
                </h3>
                <p className="text-white/60 font-light" style={{ lineHeight: '1.8' }}>
                  {feature.description}
                </p>
              </div>
              
              <div className="md:col-span-4 flex items-start justify-end">
                <span className="inline-block px-3 py-1 bg-[#d2ac67] text-black text-xs uppercase tracking-wider font-bold">
                  {feature.tech}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-32 text-center border-t border-white/10 pt-32"
        >
          <h2 
            className="text-[clamp(2.5rem,8vw,5rem)] font-black mb-8"
            style={{ letterSpacing: '-0.02em' }}
          >
            Ready to Experience It?
          </h2>
          <button
            onClick={() => navigate('/auth')}
            className="px-12 py-4 bg-[#00a651] text-white text-sm uppercase tracking-widest font-bold"
          >
            Get Started →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
