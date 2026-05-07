import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Clock, BarChart } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-400">QuizForge AI</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-2 rounded-lg font-medium hover:text-cyan-400 transition-colors">Login</Link>
          <Link to="/register" className="glass-button">Get Started</Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
          >
            Transform any document into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-400">interactive quizzes</span> instantly
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-400 mb-12 max-w-2xl"
          >
            Upload your syllabus, notes, or PDFs and let our advanced AI generate tailored, high-quality multiple choice questions to boost your learning.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link to="/register" className="glass-button text-lg px-8 py-4">Start Generating for Free</Link>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <FeatureCard 
            icon={<BookOpen className="w-10 h-10 text-indigo-500" />}
            title="Smart Parsing"
            description="Upload PDF, DOCX, or TXT files. Our engine extracts the core concepts automatically."
          />
          <FeatureCard 
            icon={<Brain className="w-10 h-10 text-cyan-400" />}
            title="AI Generation"
            description="Choose difficulty and topics. Get uniquely generated quizzes powered by Gemini."
          />
          <FeatureCard 
            icon={<BarChart className="w-10 h-10 text-purple-500" />}
            title="Deep Analytics"
            description="Track your progress over time, identify weak areas, and optimize your study sessions."
          />
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-panel p-8 rounded-2xl"
  >
    <div className="mb-6 bg-gray-800/50 w-16 h-16 rounded-xl flex items-center justify-center border border-gray-700/50">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

export default Home;
