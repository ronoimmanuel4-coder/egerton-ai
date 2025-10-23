import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Collapse,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Chat,
  Send,
  Close,
  SmartToy,
  Person,
  Quiz,
  School,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const ChatbotWidget = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your EduVault AI assistant. How can I help you with your studies today?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    try {
      const response = await api.get('/api/chatbot/suggestions', {
        params: {
          course: user?.course?.name,
          unit: 'current_unit' // This could be dynamic based on user's current page
        }
      });
      setSuggestions(response.data.suggestions.slice(0, 6));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const context = {
        course: user?.course?.name,
        year: user?.yearOfStudy,
        institution: user?.institution?.name
      };

      const response = await api.post('/api/chatbot/query', {
        message,
        context
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.message,
        timestamp: new Date(),
        isFailover: response.data.isFailover
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async (topic) => {
    const quizMessage = `Create a 5-question quiz on ${topic}`;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: quizMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.post('/api/chatbot/quiz', {
        topic,
        questionCount: 5,
        difficulty: 'medium'
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.quiz,
        timestamp: new Date(),
        isQuiz: true,
        isFailover: response.data.isFailover
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I couldn\'t generate a quiz right now. Please try again later.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.toLowerCase().includes('quiz')) {
      const topic = suggestion.replace(/create a.*quiz on|quiz me on|quiz for/gi, '').trim();
      generateQuiz(topic || 'your current topic');
    } else {
      sendMessage(suggestion);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content) => {
    // Simple formatting for quiz content
    return content.split('\n').map((line, index) => (
      <Typography
        key={index}
        variant="body2"
        sx={{
          mb: line.trim() ? 0.5 : 1,
          fontWeight: line.startsWith('Q') || line.startsWith('Correct Answer:') ? 600 : 400,
          color: line.startsWith('Correct Answer:') ? theme.palette.success.main : 'inherit'
        }}
      >
        {line}
      </Typography>
    ));
  };

  return (
    <>
      {/* Chat Widget Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: 'fixed',
          bottom: isMobile ? 16 : 20,
          right: isMobile ? 16 : 20,
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            width: isMobile ? 56 : 60,
            height: isMobile ? 56 : 60,
            bgcolor: theme.palette.primary.main,
            color: 'white',
            boxShadow: theme.shadows[8],
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isOpen ? <Close /> : <Chat />}
        </IconButton>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: isMobile ? 0 : 100,
              right: isMobile ? 0 : 20,
              left: isMobile ? 0 : 'auto',
              width: isMobile ? '100%' : 400,
              height: isMobile ? '100vh' : 600,
              maxHeight: isMobile ? '100vh' : 600,
              zIndex: 999,
            }}
          >
            <Paper
              elevation={16}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: isMobile ? 0 : 3,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  p: isMobile ? 1.5 : 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <SmartToy sx={{ fontSize: isMobile ? 20 : 24 }} />
                <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ flexGrow: 1 }}>
                  {isMobile ? 'AI Assistant' : 'EduVault AI Assistant'}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setIsOpen(false)}
                  sx={{ color: 'white' }}
                >
                  <Close />
                </IconButton>
              </Box>

              {/* Messages */}
              <Box
                sx={{
                  flexGrow: 1,
                  overflow: 'auto',
                  p: isMobile ? 1 : 1.5,
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                }}
              >
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: isMobile ? 1 : 1.5,
                        maxWidth: isMobile ? '85%' : '80%',
                        bgcolor: message.type === 'user' 
                          ? theme.palette.primary.main 
                          : message.isError 
                            ? theme.palette.error.light
                            : theme.palette.background.paper,
                        color: message.type === 'user' ? 'white' : 'inherit',
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {message.type === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {message.type === 'user' ? 'You' : 'AI Assistant'}
                          {message.isFailover && ' (Offline Mode)'}
                        </Typography>
                      </Box>
                      {message.isQuiz ? formatMessage(message.content) : (
                        <Typography variant="body2">{message.content}</Typography>
                      )}
                    </Paper>
                  </Box>
                ))}
                
                {isLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                    <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2">AI is thinking...</Typography>
                      </Box>
                    </Paper>
                  </Box>
                )}
                
                <div ref={messagesEndRef} />
              </Box>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <Box sx={{ p: isMobile ? 0.75 : 1, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                    Quick suggestions:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {suggestions.slice(0, isMobile ? 3 : 4).map((suggestion, index) => (
                      <Chip
                        key={index}
                        label={suggestion}
                        size="small"
                        onClick={() => handleSuggestionClick(suggestion)}
                        sx={{ fontSize: isMobile ? '0.65rem' : '0.7rem' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Input */}
              <Box sx={{ p: isMobile ? 1.5 : 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={isMobile ? 2 : 3}
                    placeholder={isMobile ? "Ask me anything..." : "Ask me anything about your studies..."}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    size="small"
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: isMobile ? '0.875rem' : '1rem',
                      }
                    }}
                  />
                  <IconButton
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      minWidth: isMobile ? 40 : 48,
                      height: isMobile ? 40 : 48,
                      '&:hover': { bgcolor: theme.palette.primary.dark },
                      '&:disabled': { bgcolor: 'grey.300' },
                    }}
                  >
                    <Send sx={{ fontSize: isMobile ? 18 : 24 }} />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
