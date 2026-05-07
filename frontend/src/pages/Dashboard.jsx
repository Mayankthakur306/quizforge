import React, { useEffect, useState } from 'react';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { Link } from 'react-router-dom';
import { FileText, Award, Target, Play, BarChart2, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, avgAccuracy: 0 });
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('accuracy'); // accuracy, marks, consistency

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userKey = currentUser.email.replace(/\./g, ",");
        
        const resultsRef = ref(db, `users/${userKey}/results`);
        const resSnapshot = await get(resultsRef);

        let resultsList = [];
        let totalScoreSum = 0;
        let totalAccuracySum = 0;

        if (resSnapshot.exists()) {
          resSnapshot.forEach(child => {
            const resData = child.val();
            
            resultsList.push({
              id: child.key,
              score: resData.score,
              total: resData.total,
              accuracy: resData.accuracy,
              completedAt: resData.completedAt,
              topic: resData.topic || 'Document Quiz',
              difficulty: resData.difficulty || 'Unknown',
            });

            totalScoreSum += (resData.score / resData.total) * 100;
            totalAccuracySum += resData.accuracy;
          });
        }

        // Sort by completedAt descending
        resultsList.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        setHistory(resultsList);

        if (resultsList.length > 0) {
          setStats({
            total: resultsList.length,
            avgScore: Math.round(totalScoreSum / resultsList.length),
            avgAccuracy: Math.round(totalAccuracySum / resultsList.length)
          });
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  // --- Chart Data Processing ---
  // We reverse history so the chart goes chronologically left-to-right
  const chronologicalHistory = [...history].reverse();

  // 1. Accuracy Data
  const accuracyData = chronologicalHistory.map((item, index) => ({
    name: `Quiz ${index + 1}`,
    topic: item.topic,
    accuracy: item.accuracy,
    date: new Date(item.completedAt).toLocaleDateString()
  }));

  // 2. Marks Data
  const marksData = chronologicalHistory.map((item, index) => ({
    name: `Quiz ${index + 1}`,
    topic: item.topic,
    scorePercentage: Math.round((item.score / item.total) * 100),
    scoreText: `${item.score}/${item.total}`,
    date: new Date(item.completedAt).toLocaleDateString()
  }));

  // 3. Consistency Data (Group by Date)
  const consistencyMap = {};
  chronologicalHistory.forEach(item => {
    const dateStr = new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    consistencyMap[dateStr] = (consistencyMap[dateStr] || 0) + 1;
  });
  const consistencyData = Object.keys(consistencyMap).map(date => ({
    date,
    testsTaken: consistencyMap[date]
  }));


  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl">
          <p className="font-semibold text-gray-200">{label}</p>
          {payload[0].payload.topic && <p className="text-sm text-gray-400 mb-2">{payload[0].payload.topic}</p>}
          <p className="text-sm font-bold text-indigo-400">
            {payload[0].name}: {payload[0].value}{payload[0].name === 'accuracy' || payload[0].name === 'scorePercentage' ? '%' : ''}
          </p>
          {payload[0].payload.scoreText && (
            <p className="text-xs text-gray-500 mt-1">Raw Score: {payload[0].payload.scoreText}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {currentUser?.name || 'User'}! 👋</h1>
        <p className="text-gray-400">Track your progress and keep the momentum going.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard icon={<FileText className="text-blue-400 w-8 h-8"/>} title="Total Quizzes Taken" value={stats.total} />
        <StatCard icon={<Award className="text-yellow-400 w-8 h-8"/>} title="Avg. Score" value={`${stats.avgScore}%`} />
        <StatCard icon={<Target className="text-green-400 w-8 h-8"/>} title="Avg. Accuracy" value={`${stats.avgAccuracy}%`} />
      </div>

      {/* Quiz History List */}
      <div className="glass-panel p-6 rounded-2xl mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Detailed Quiz History</h2>
          <Link to="/upload" className="glass-button text-sm py-2 px-4">Take New Quiz</Link>
        </div>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-800/50 rounded-xl border border-gray-700/50"></div>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id} 
                className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-colors gap-4"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-white mb-1">{item.topic}</h3>
                  <div className="text-sm text-gray-400 flex flex-wrap gap-x-4 gap-y-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {new Date(item.completedAt).toLocaleDateString()} at {new Date(item.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs">{item.difficulty}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Score</p>
                    <p className="font-bold text-xl">{item.score}<span className="text-sm text-gray-500">/{item.total}</span></p>
                  </div>
                  
                  <div className="text-center border-l border-gray-700 pl-6">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Accuracy</p>
                    <p className={`font-bold text-xl ${item.accuracy >= 80 ? 'text-green-400' : item.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {item.accuracy}%
                    </p>
                  </div>

                  <Link to={`/results/${item.quizId}`} className="ml-2 p-3 bg-indigo-600/20 text-indigo-400 rounded-full hover:bg-indigo-600 hover:text-white transition-colors group">
                    <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <p className="mb-4">No quiz history found.</p>
            <Link to="/upload" className="glass-button-outline">Generate your first quiz</Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ icon, title, value }) => (
  <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
    <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700/50">
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  </div>
);

export default Dashboard;
