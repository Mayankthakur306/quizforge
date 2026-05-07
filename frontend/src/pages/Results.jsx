import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Award, Target, Clock, ArrowRight, RotateCcw } from 'lucide-react';

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [resultData, setResultData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const userKey = currentUser.email.replace(/\./g, ",");
        const resultDoc = await get(ref(db, `users/${userKey}/results/${id}`));
        
        if (resultDoc.exists()) {
          const resData = resultDoc.val();
          
          setResultData({
            score: resData.score,
            total: resData.total,
            accuracy: resData.accuracy,
            selectedAnswers: resData.selectedAnswers
          });
          
          // Fallback check to support legacy mixed architecture, but primary read directly from result node.
          if (resData.questions) {
            setQuizData({
              topic: resData.topic,
              difficulty: resData.difficulty,
              questions: resData.questions
            });
          } else {
             // For older results saved before we merged the quiz into the result object
             const quizDoc = await get(ref(db, `users/${userKey}/quizzes/${resData.quizId}`));
             if (quizDoc.exists()) {
               setQuizData(quizDoc.val());
             } else {
               navigate('/dashboard');
             }
          }
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchResults();
    }
  }, [id, currentUser, navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!resultData || !quizData) return null;

  const { score, total, accuracy, selectedAnswers } = resultData;
  const incorrect = total - score;

  const pieData = [
    { name: 'Correct', value: score, color: '#10B981' }, // Green
    { name: 'Incorrect', value: incorrect, color: '#EF4444' }, // Red
  ];

  let message = "Good effort!";
  if (accuracy >= 90) message = "Outstanding Performance! 🏆";
  else if (accuracy >= 70) message = "Great Job! 🌟";
  else if (accuracy < 50) message = "Keep Practicing! 💪";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">{message}</h1>
          <p className="text-gray-400 text-lg">You've completed the {quizData.topic} quiz.</p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-gray-400 font-medium mb-1">Final Score</h3>
            <p className="text-3xl font-bold">{score} <span className="text-lg text-gray-500">/ {total}</span></p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center mb-4">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-gray-400 font-medium mb-1">Accuracy</h3>
            <p className="text-3xl font-bold">{accuracy}%</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-gray-400 font-medium mb-1">Difficulty</h3>
            <p className="text-3xl font-bold">{quizData.difficulty}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Accuracy Pie Chart */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-6">Result Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Correct ({score})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Incorrect ({incorrect})</span>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="glass-panel p-8 rounded-2xl flex flex-col justify-center items-center text-center">
            <h3 className="text-2xl font-bold mb-4">What's Next?</h3>
            <p className="text-gray-400 mb-8 max-w-sm">Review your detailed answers below, or generate a new quiz to continue learning.</p>
            
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="glass-button w-full"
              >
                Review Answers
              </button>
              <Link to="/upload" className="glass-button-outline w-full">
                <RotateCcw className="w-4 h-4" /> Generate New Quiz
              </Link>
              <Link to="/dashboard" className="text-gray-400 hover:text-white mt-2 text-sm flex items-center justify-center gap-1 transition-colors">
                Back to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Review */}
        <div className="glass-panel p-8 rounded-2xl">
          <h3 className="text-2xl font-bold mb-8 border-b border-gray-700 pb-4">Detailed Answer Review</h3>
          
          <div className="space-y-8">
            {quizData.questions.map((q, idx) => {
              const userAnswer = selectedAnswers[idx];
              const isCorrect = userAnswer === q.correctAnswer;
              
              return (
                <div key={idx} className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                  <div className="flex gap-4 mb-4">
                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium mb-3">{q.question}</h4>
                      
                      <div className="grid md:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt, optIdx) => {
                          let bgColor = "bg-gray-800/50";
                          let borderColor = "border-transparent";
                          let textStyle = "text-gray-300";

                          if (opt === q.correctAnswer) {
                            bgColor = "bg-green-500/20";
                            borderColor = "border-green-500";
                            textStyle = "text-green-300 font-medium";
                          } else if (opt === userAnswer && !isCorrect) {
                            bgColor = "bg-red-500/20";
                            borderColor = "border-red-500";
                            textStyle = "text-red-300 line-through";
                          }

                          return (
                            <div key={optIdx} className={`p-3 rounded-lg border ${bgColor} ${borderColor} ${textStyle}`}>
                              {opt}
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg mt-4">
                        <span className="font-semibold text-indigo-400 mr-2">Explanation:</span>
                        <span className="text-gray-300 text-sm">{q.explanation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Results;
