import React, { useEffect, useState } from 'react';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { TrendingUp, Award, Calendar, BarChart2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('accuracy'); // accuracy, marks, consistency

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const userKey = currentUser.email.replace(/\./g, ",");
        
        const resultsRef = ref(db, `users/${userKey}/results`);
        const resSnapshot = await get(resultsRef);

        let resultsList = [];

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
            });
          });
        }

        // Sort by completedAt descending
        resultsList.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        setHistory(resultsList);

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchAnalyticsData();
    }
  }, [currentUser]);

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

  // 3. Consistency Data
  const consistencyMap = {};
  chronologicalHistory.forEach(item => {
    const dateStr = new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    consistencyMap[dateStr] = (consistencyMap[dateStr] || 0) + 1;
  });
  const consistencyData = Object.keys(consistencyMap).map(date => ({
    date,
    testsTaken: consistencyMap[date]
  }));

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
        <h1 className="text-3xl font-bold mb-2">Performance Analytics 📊</h1>
        <p className="text-gray-400">Deep dive into your quiz performance and learning consistency.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl mb-10 h-full flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-xl font-bold">Progress Charts</h2>
          
          <div className="flex bg-gray-800/80 p-1 rounded-lg border border-gray-700/50 w-full md:w-auto">
            <button 
              onClick={() => setActiveChart('accuracy')}
              className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeChart === 'accuracy' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <TrendingUp className="w-4 h-4" /> Accuracy
            </button>
            <button 
              onClick={() => setActiveChart('marks')}
              className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeChart === 'marks' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Award className="w-4 h-4" /> Marks
            </button>
            <button 
              onClick={() => setActiveChart('consistency')}
              className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeChart === 'consistency' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Calendar className="w-4 h-4" /> Consistency
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="h-96 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : history.length > 0 ? (
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'accuracy' ? (
                <LineChart data={accuracyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickMargin={10} />
                  <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: '#1F2937' }} activeDot={{ r: 8 }} />
                </LineChart>
              ) : activeChart === 'marks' ? (
                <BarChart data={marksData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickMargin={10} />
                  <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="scorePercentage" name="Score" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={consistencyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} tickMargin={10} />
                  <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF'}} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="testsTaken" name="Tests Taken" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex flex-col justify-center items-center text-gray-500">
            <BarChart2 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">Take your first quiz to generate analytics!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
