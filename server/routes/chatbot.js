const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const EGERTON_CONFIG = require('../config/egerton');
const { generateText } = require('../services/geminiClient');
const router = express.Router();

// Helper function to call AI (Gemini via geminiClient)
async function callLocalLlama(messages, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 500,
  } = options;

  const systemMessage = messages.find((m) => m.role === 'system');
  const userMessages = messages.filter((m) => m.role === 'user');
  const lastUser = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;

  const aiText = await generateText({
    systemPrompt: systemMessage?.content || EGERTON_CONFIG.ai.prompts.base,
    userMessage: lastUser?.content || '',
    history: [],
    temperature,
    maxOutputTokens: maxTokens,
  });

  return aiText;
}

// Helper to build enriched context
function buildEgertonContext(user, context = {}) {
  let systemPrompt = EGERTON_CONFIG.ai.prompts.base;

  // Add student context
  if (user) {
    systemPrompt += '\n\n' + EGERTON_CONFIG.ai.prompts.studentContext({
      firstName: user.firstName,
      lastName: user.lastName,
      course: user.course,
      yearOfStudy: user.yearOfStudy,
      learningPattern: user.learningPattern,
      strengths: user.strengths,
      weaknesses: user.weaknesses,
    });
  }

  // Add course/unit context
  if (context.course || context.unit) {
    systemPrompt += '\n\n' + EGERTON_CONFIG.ai.prompts.courseContext(
      context.course || user?.course || {},
      context.unit
    );
  }

  // Add lecturer context if available
  if (context.lecturer) {
    systemPrompt += '\n\n' + EGERTON_CONFIG.ai.prompts.lecturerContext(context.lecturer);
  }

  return systemPrompt;
}

// @route   POST /api/chatbot/query
// @desc    Send query to Egerton AI Assistant (Local Llama)
// @access  Private
router.post('/query', [
  auth,
  body('message').trim().isLength({ min: 1, max: 1000 }),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, context } = req.body;
    const user = req.user;

    // Build Egerton-specific context
    const systemPrompt = buildEgertonContext(user, context);

    try {
      // Call local Llama model
      const aiResponse = await callLocalLlama([
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ]);

      res.json({
        message: aiResponse,
        timestamp: new Date().toISOString(),
        model: EGERTON_CONFIG.ai.local.model,
        university: 'Egerton University',
      });

    } catch (aiError) {
      console.error('AI API error:', aiError);
      
      // Fallback response if AI service is unavailable
      let fallbackResponse = "I'm currently unable to connect to the Egerton AI Learning Assistant. ";
      
      if (message.toLowerCase().includes('quiz')) {
        fallbackResponse += "For quiz creation, try breaking down your topic into key concepts and create questions around those areas.";
      } else if (message.toLowerCase().includes('exam')) {
        fallbackResponse += "For exam preparation, review your course materials and past papers from your lecturer.";
      } else if (message.toLowerCase().includes('explain')) {
        fallbackResponse += "For explanations, I recommend checking your Egerton course materials or consulting with your lecturers.";
      } else {
        fallbackResponse += "Please try again in a moment. If the issue persists, contact support.";
      }

      res.json({
        message: fallbackResponse,
        timestamp: new Date().toISOString(),
        isFailover: true,
        suggestion: 'Make sure Ollama is running: ollama serve',
      });
    }

  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chatbot/quiz
// @desc    Generate quiz for specific topic using Egerton AI
// @access  Private
router.post('/quiz', [
  auth,
  body('topic').trim().isLength({ min: 2, max: 200 }),
  body('questionCount').isInt({ min: 1, max: 10 }),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topic, questionCount, difficulty = 'medium', context } = req.body;
    const user = req.user;

    // Build context for quiz generation
    let systemPrompt = `You are the Egerton University AI quiz generator. Create academically rigorous quizzes aligned with Egerton's curriculum standards.`;
    
    if (user?.course) {
      systemPrompt += `\n\nStudent Course: ${user.course.name} (${user.course.code})`;
      systemPrompt += `\nYear of Study: ${user.yearOfStudy}`;
    }

    if (context?.lecturer) {
      systemPrompt += `\n\nLecturer Context: ${JSON.stringify(context.lecturer)}`;
      systemPrompt += `\nNote: Generate questions in the style this lecturer typically uses.`;
    }

    const quizPrompt = `Create a ${difficulty} level quiz about "${topic}" with exactly ${questionCount} multiple choice questions. 
    
    Format each question as:
    Q1: [Question text]
    A) [Option A]
    B) [Option B] 
    C) [Option C]
    D) [Option D]
    Correct Answer: [Letter]
    Explanation: [Brief explanation of why this is correct]
    
    Make questions relevant to Egerton University curriculum and Kenyan higher education context.
    Ensure questions test deep understanding, not just memorization.`;

    try {
      const quiz = await callLocalLlama([
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: quizPrompt,
        },
      ], { temperature: 0.8, maxTokens: 800 });

      res.json({
        quiz,
        topic,
        questionCount,
        difficulty,
        timestamp: new Date().toISOString(),
        model: EGERTON_CONFIG.ai.local.model,
        university: 'Egerton University',
      });

    } catch (aiError) {
      console.error('Quiz generation error:', aiError);
      
      // Fallback quiz template
      const fallbackQuiz = `Quiz on ${topic}

Q1: What is the main concept related to ${topic}?
A) Option A
B) Option B
C) Option C
D) Option D
Correct Answer: C
Explanation: This is a template quiz.

Please note: Egerton AI Learning Assistant is currently unavailable. Try again later or contact support if this keeps happening.`;

      res.json({
        quiz: fallbackQuiz,
        topic,
        questionCount,
        difficulty,
        timestamp: new Date().toISOString(),
        isFailover: true,
        suggestion: 'Start Ollama service to use AI quiz generation',
      });
    }

  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chatbot/suggestions
// @desc    Get suggested questions/topics for Egerton students
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { course, unit } = req.query;
    const user = req.user;

    // Egerton-specific AI suggestions
    let suggestions = [
      "Explain this concept in simple terms",
      "Create a practice quiz for me",
      "What exam questions might my lecturer ask?",
      "Generate a mnemonic to remember this",
      "What are the key points I should focus on?",
      "Help me understand this better",
      "Give me practice questions",
      "What's the best way to study this topic?",
      "Predict what might be on the exam",
      "Create a study plan for me"
    ];

    // Add personalized suggestions based on student profile
    if (user?.course) {
      suggestions.unshift(
        `Study tips for ${user.course.name}`,
        `Quiz me on ${user.course.name} topics`,
        `Exam predictions for my course`
      );
    }

    if (course) {
      suggestions.unshift(
        `Explain key concepts in ${course}`,
        `What exam topics are common in ${course}?`,
        `Create a study guide for ${course}`
      );
    }

    if (unit) {
      suggestions.unshift(
        `Explain ${unit} in detail`,
        `Quiz me on ${unit}`,
        `What might my lecturer ask about ${unit}?`
      );
    }

    res.json({ 
      suggestions,
      university: 'Egerton University',
      aiName: EGERTON_CONFIG.ai.systemName,
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
