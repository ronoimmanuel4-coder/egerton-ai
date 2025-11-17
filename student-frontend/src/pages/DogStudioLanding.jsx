import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function DogStudioLanding() {
  const navigate = useNavigate();
  
  const features = [
    {
      year: '2024 - Ongoing',
      title: 'AI Study Partner',
      subtitle: 'Personalized Learning',
      tag: 'ARTIFICIAL INTELLIGENCE',
    },
    {
      year: '2024 - Ongoing',
      title: 'Smart Analytics',
      subtitle: 'Performance Tracking',
      tag: 'DATA SCIENCE',
    },
    {
      year: '2024 - Ongoing',
      title: 'Exam Prediction',
      subtitle: 'Pattern Recognition',
      tag: 'MACHINE LEARNING',
    },
    {
      year: '2024 - Ongoing',
      title: 'Course Management',
      subtitle: 'Digital Learning',
      tag: 'EDUCATION TECH',
    },
    {
      year: '2024 - Ongoing',
      title: 'Study Groups',
      subtitle: 'Collaborative Learning',
      tag: 'SOCIAL LEARNING',
    },
    {
      year: '2024 - Ongoing',
      title: 'Resource Library',
      subtitle: 'Knowledge Base',
      tag: 'CONTENT MANAGEMENT',
    },
  ];
  
  return (
    <div className="bg-black min-h-screen text-white">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-8 py-32">
        <div className="max-w-7xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 
              className="text-[clamp(3rem,12vw,9rem)] font-black leading-none mb-8"
              style={{ letterSpacing: '-0.02em' }}
            >
              We Make Good AI
            </h1>
            <p 
              className="text-xl md:text-2xl text-white/60 font-light max-w-2xl mb-12"
              style={{ letterSpacing: '0.5em' }}
            >
              FOR EGERTONIANS
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-4 bg-[#00a651] text-white text-sm uppercase tracking-widest font-bold"
              >
                Get Started →
              </button>
              <button
                onClick={() => navigate('/features')}
                className="px-8 py-4 border border-white/10 text-white text-sm uppercase tracking-widest font-light"
              >
                Our Features
              </button>
            </div>
            
            <div className="text-sm text-white/40 max-w-3xl" style={{ lineHeight: '1.8' }}>
              <p className="font-light">
                Egerton AI is a next-generation learning platform at the intersection of artificial intelligence,
                education, and technology. Our goal is to deliver transformative learning experiences that
                empower students and build strategic value for the Egerton University community.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Featured Programs Section */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 
              className="text-sm uppercase tracking-widest text-white/50 mb-12"
              style={{ letterSpacing: '0.2em' }}
            >
              Featured Programs
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => navigate('/features')}
                className="border-t border-white/10 pt-8 pb-12 cursor-pointer group"
              >
                <p className="text-xs text-white/40 uppercase tracking-wider mb-4">
                  {feature.year}
                </p>
                <h3 
                  className="text-3xl font-bold mb-2"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {feature.title}
                </h3>
                <p className="text-white/60 mb-6 font-light">
                  {feature.subtitle}
                </p>
                <span className="inline-block px-3 py-1 bg-[#d2ac67] text-black text-xs uppercase tracking-wider font-bold">
                  {feature.tag}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Statistics Section */}
      <section className="py-32 px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-12"
          >
            <div className="text-center">
              <div className="text-[clamp(3rem,8vw,5rem)] font-black text-[#00a651] mb-2">
                15K+
              </div>
              <p className="text-sm uppercase tracking-widest text-white/50">
                Students
              </p>
            </div>
            <div className="text-center">
              <div className="text-[clamp(3rem,8vw,5rem)] font-black text-[#d2ac67] mb-2">
                200+
              </div>
              <p className="text-sm uppercase tracking-widest text-white/50">
                Courses
              </p>
            </div>
            <div className="text-center">
              <div className="text-[clamp(3rem,8vw,5rem)] font-black text-[#ed1c24] mb-2">
                95%
              </div>
              <p className="text-sm uppercase tracking-widest text-white/50">
                Success Rate
              </p>
            </div>
            <div className="text-center">
              <div className="text-[clamp(3rem,8vw,5rem)] font-black text-[#00a651] mb-2">
                50+
              </div>
              <p className="text-sm uppercase tracking-widest text-white/50">
                Years Excellence
              </p>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-[clamp(2.5rem,8vw,5rem)] font-black mb-8"
              style={{ letterSpacing: '-0.02em' }}
            >
              Ready to Start?
            </h2>
            <p 
              className="text-xl text-white/60 font-light mb-12 max-w-2xl mx-auto"
              style={{ letterSpacing: '0.05em' }}
            >
              Join thousands of Egerton students using AI to excel in their studies
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="px-12 py-4 bg-[#00a651] text-white text-sm uppercase tracking-widest font-bold"
            >
              Get Started →
            </button>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Column 1 */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-black mb-4">
                Egerton<span className="text-[#00a651]">.</span>
              </h3>
              <p className="text-sm text-white/60 font-light mb-4">
                AI-powered learning platform for Egerton University students.
              </p>
              <p className="text-xs text-white/40 uppercase tracking-widest">
                Sic Donec
              </p>
            </div>
            
            {/* Column 2 */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white/50 mb-6">
                Platform
              </h4>
              <nav className="flex flex-col gap-3">
                <Link to="/features" label="Features" />
                <Link to="/about" label="About" />
                <Link to="/auth" label="Login" />
              </nav>
            </div>
            
            {/* Column 3 */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white/50 mb-6">
                Services
              </h4>
              <nav className="flex flex-col gap-3">
                <Link to="/features" label="AI Learning" />
                <Link to="/features" label="Analytics" />
                <Link to="/features" label="Resources" />
              </nav>
            </div>
            
            {/* Column 4 */}
            <div>
              <h4 className="text-xs uppercase tracking-widest text-white/50 mb-6">
                Contact
              </h4>
              <div className="flex flex-col gap-3 text-sm text-white/60">
                <p>Nakuru • +254 20 2310900</p>
                <p>Njoro • +254 20 2310900</p>
                <a href="mailto:ai@egerton.ac.ke" className="text-[#00a651]">
                  ai@egerton.ac.ke
                </a>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-xs text-white/40">
            <p>© 2024 Egerton University. All rights reserved.</p>
            <p>Made with 🦁 in Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Link({ to, label }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="text-sm text-white/60 text-left"
    >
      {label}
    </button>
  );
}
