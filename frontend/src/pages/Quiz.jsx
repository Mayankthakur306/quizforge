import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, get, set, push } from 'firebase/database';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id === 'session') {
      if (location.state?.quizData) {
        setQuizData(location.state.quizData);
        setTimeLeft((location.state.quizData.questions?.length || 0) * 60);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  }, [id, location.state, navigate]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished && quizData) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && quizData && !isFinished) {
      handleFinish();
    }
  }, [timeLeft, isFinished, quizData]);

  const handleSelectOption = (option) => {
    if (showExplanation) return; // Prevent changing after checking answer in instant feedback mode (optional)
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIdx]: option
    });
  };

  const handleNext = () => {
    if (currentQuestionIdx < quizData.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const handleFinish = async () => {
    setIsFinished(true);
    
    // Calculate score
    let score = 0;
    const questions = quizData.questions;
    
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score += 1;
      }
    });

    const accuracy = Math.round((score / questions.length) * 100);
    const resultData = {
      quizId: id,
      userId: currentUser.email,
      score,
      total: questions.length,
      accuracy,
      selectedAnswers,
      completedAt: new Date().toISOString()
    };

    try {
      const userKey = currentUser.email.replace(/\./g, ",");
      const newResultRef = push(ref(db, `users/${userKey}/results`));
      
      const combinedResultData = {
        resultId: newResultRef.key,
        score: score,
        total: questions.length,
        accuracy: accuracy,
        selectedAnswers: selectedAnswers,
        topic: quizData.topic || "Document Quiz",
        difficulty: quizData.difficulty || "Medium",
        questions: quizData.questions,
        completedAt: new Date().toISOString()
      };

      console.log("Saving Result...");
      console.log(combinedResultData);

      // Wait for database write success THEN navigate
      await set(newResultRef, combinedResultData);
      
      console.log("Saved Successfully");
      
      navigate(`/results/${newResultRef.key}`);
    } catch (error) {
      console.error("Error saving result:", error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!quizData) return null;

  const currentQuestion = quizData.questions[currentQuestionIdx];
  const progress = ((currentQuestionIdx + 1) / quizData.questions.length) * 100;
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto h-full flex flex-col">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{quizData.topic} Quiz</h1>
            <p className="text-gray-400 text-sm">Question {currentQuestionIdx + 1} of {quizData.questions.length}</p>
          </div>
          
          <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2 text-indigo-400 font-mono font-bold text-lg">
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-2 rounded-full mb-8 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
          ></motion.div>
        </div>

        {/* Question Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="glass-panel p-8 rounded-2xl"
            >
              <h2 className="text-xl md:text-2xl font-semibold mb-8">{currentQuestion.question}</h2>
              
              <div className="space-y-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIdx] === option;
                  const isCorrect = option === currentQuestion.correctAnswer;
                  
                  // Style logic for feedback mode
                  let optionStyle = "border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-indigo-500";
                  if (isSelected) optionStyle = "border-indigo-500 bg-indigo-500/10";
                  
                  if (showExplanation) {
                    if (isCorrect) {
                      optionStyle = "border-green-500 bg-green-500/20";
                    } else if (isSelected && !isCorrect) {
                      optionStyle = "border-red-500 bg-red-500/20";
                    } else {
                      optionStyle = "border-gray-800 bg-gray-900 opacity-50 cursor-not-allowed";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={showExplanation}
                      onClick={() => handleSelectOption(option)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${optionStyle}`}
                    >
                      <span>{option}</span>
                      {showExplanation && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback toggle */}
              {!showExplanation && selectedAnswers[currentQuestionIdx] && (
                <button 
                  onClick={() => setShowExplanation(true)}
                  className="mt-6 text-sm text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Check Answer Instantly
                </button>
              )}

              {/* Explanation Box */}
              {showExplanation && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 rounded-xl bg-indigo-900/30 border border-indigo-500/30"
                >
                  <h4 className="font-semibold text-indigo-300 mb-2">Explanation:</h4>
                  <p className="text-sm text-gray-300">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-between items-center pb-6">
          <button 
            onClick={handlePrev}
            disabled={currentQuestionIdx === 0}
            className={`glass-button-outline ${currentQuestionIdx === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>

          <div className="flex gap-2">
            {quizData.questions.map((_, idx) => (
              <div 
                key={idx}
                className={`w-2.5 h-2.5 rounded-full ${
                  idx === currentQuestionIdx ? 'bg-indigo-500 ring-4 ring-indigo-500/30' : 
                  selectedAnswers[idx] ? 'bg-cyan-400' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          {currentQuestionIdx === quizData.questions.length - 1 ? (
            <button 
              onClick={handleFinish}
              className="glass-button bg-gradient-to-r from-green-500 to-emerald-400"
            >
              Finish Quiz <CheckCircle className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestionIdx] && !showExplanation}
              className={`glass-button ${(!selectedAnswers[currentQuestionIdx] && !showExplanation) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Quiz;
