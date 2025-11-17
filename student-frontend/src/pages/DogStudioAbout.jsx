import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function DogStudioAbout() {
  const navigate = useNavigate();
  
  const values = [
    {
      number: '01',
      title: 'AI-First Learning',
      description: 'We believe artificial intelligence is the future of education. Every feature is designed to harness the power of AI for better learning outcomes.',
    },
    {
      number: '02',
      title: 'Student Empowerment',
      description: 'Our platform puts students in control of their learning journey. We provide the tools, you drive the results.',
    },
    {
      number: '03',
      title: 'Continuous Innovation',
      description: 'We never stop improving. Regular updates and new features keep the platform at the cutting edge of educational technology.',
    },
    {
      number: '04',
      title: 'Personalized Experience',
      description: 'No two students learn the same way. Our AI adapts to your unique learning style and pace.',
    },
    {
      number: '05',
      title: 'Data-Driven Excellence',
      description: 'Every recommendation, every insight is backed by data science and proven learning methodologies.',
    },
    {
      number: '06',
      title: 'Accessibility for All',
      description: 'Quality education should be accessible to everyone. Our platform is designed to be inclusive and user-friendly.',
    },
    {
      number: '07',
      title: 'Collaborative Growth',
      description: 'We foster a community of learners who support and learn from each other through collaborative features.',
    },
    {
      number: '08',
      title: 'Transparent AI',
      description: 'We believe in ethical AI. Our algorithms are transparent, fair, and designed with student privacy in mind.',
    },
    {
      number: '09',
      title: 'Long-term Success',
      description: 'We measure success not by short-term grades, but by long-term learning and skill development.',
    },
    {
      number: '10',
      title: 'We Make Good AI',
      description: 'Quality over quantity. Every AI feature is thoroughly tested and optimized for the best student experience.',
    },
  ];
  
  return (
    <div className="bg-black min-h-screen text-white pt-32 px-8 pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
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
            We're just making Good AI like it's 2024
          </h1>
        </motion.div>
        
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-32 grid md:grid-cols-2 gap-16"
        >
          <div>
            <h2 className="text-sm uppercase tracking-widest text-white/50 mb-8">
              Our Story
            </h2>
            <p className="text-xl text-white/80 font-light mb-6" style={{ lineHeight: '1.8' }}>
              Egerton AI is a next-generation learning platform built specifically for Egerton University students.
              We combine cutting-edge artificial intelligence with deep understanding of the Egerton academic experience.
            </p>
            <p className="text-xl text-white/80 font-light" style={{ lineHeight: '1.8' }}>
              Our mission is to empower every Egertonian with AI-powered tools that make studying smarter,
              not harder. From personalized learning paths to intelligent exam predictions, we're transforming
              the way students learn.
            </p>
          </div>
          
          <div>
            <h2 className="text-sm uppercase tracking-widest text-white/50 mb-8">
              AI is in the details
            </h2>
            <p className="text-xl text-white/80 font-light mb-6" style={{ lineHeight: '1.8' }}>
              Every feature, every algorithm, every recommendation is meticulously crafted to enhance your
              learning experience. We don't just build AI for the sake of it — we build AI that works.
            </p>
            <p className="text-xl text-white/80 font-light" style={{ lineHeight: '1.8' }}>
              Our team combines expertise in machine learning, education technology, and student psychology
              to create a platform that truly understands and supports your academic journey.
            </p>
          </div>
        </motion.div>
        
        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="mb-16">
            <h2 className="text-sm uppercase tracking-widest text-white/50 mb-8">
              Our Values
            </h2>
            <h3 
              className="text-5xl md:text-6xl font-black mb-8"
              style={{ letterSpacing: '-0.02em' }}
            >
              This is how we roll
            </h3>
          </div>
          
          <div className="space-y-0">
            {values.map((value, index) => (
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
                    {value.number}
                  </span>
                </div>
                
                <div className="md:col-span-10">
                  <h4 
                    className="text-3xl font-bold mb-4"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {value.title}
                  </h4>
                  <p className="text-white/60 font-light text-lg" style={{ lineHeight: '1.8' }}>
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Faculties */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <h2 className="text-sm uppercase tracking-widest text-white/50 mb-12">
            Serving All Faculties
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              'Agriculture',
              'Science',
              'Education',
              'Commerce',
              'Engineering',
              'Veterinary',
              'Health Sciences',
              'Arts & Social Sciences',
            ].map((faculty, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="border border-white/10 p-6"
              >
                <h3 className="text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>
                  {faculty}
                </h3>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Contact Section */}
        <motion.div
          id="contact"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="border-t border-white/10 pt-32"
        >
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 
                className="text-5xl md:text-6xl font-black mb-8"
                style={{ letterSpacing: '-0.02em' }}
              >
                Get in Touch
              </h2>
              <p className="text-xl text-white/60 font-light mb-8" style={{ lineHeight: '1.8' }}>
                Have questions? Want to learn more? We'd love to hear from you.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="px-12 py-4 bg-[#00a651] text-white text-sm uppercase tracking-widest font-bold"
              >
                Get Started →
              </button>
            </div>
            
            <div>
              <div className="mb-8">
                <h3 className="text-sm uppercase tracking-widest text-white/50 mb-4">
                  Locations
                </h3>
                <p className="text-xl text-white/80 mb-2">Nakuru • +254 20 2310900</p>
                <p className="text-xl text-white/80">Njoro • +254 20 2310900</p>
              </div>
              
              <div className="mb-8">
                <h3 className="text-sm uppercase tracking-widest text-white/50 mb-4">
                  Email
                </h3>
                <a href="mailto:ai@egerton.ac.ke" className="text-xl text-[#00a651]">
                  ai@egerton.ac.ke
                </a>
              </div>
              
              <div>
                <h3 className="text-sm uppercase tracking-widest text-white/50 mb-4">
                  University
                </h3>
                <p className="text-sm text-white/60">
                  Egerton University Main Campus<br />
                  P.O Box 536-20115<br />
                  Egerton, Kenya
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
