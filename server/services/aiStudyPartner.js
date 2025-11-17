/**
 * AI Study Partner Service
 * 
 * This AI is NOT just a Q&A bot. It's a study companion that:
 * 1. Studies the student's learning patterns
 * 2. Predicts exam questions based on lecturer patterns
 * 3. CHALLENGES the student with questions (Socratic method)
 * 4. Adapts to individual student needs
 * 5. Uses exam papers and course context for accurate predictions
 */

const axios = require('axios');
const { generateText } = require('./geminiClient');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

class AIStudyPartner {
  constructor() {
    this.conversationHistory = new Map(); // studentId -> messages[]
    this.studentProfiles = new Map(); // studentId -> learning profile
    this.examContext = new Map(); // courseId -> exam patterns
  }

  /**
   * Build context from student data, course, lecturer, and exam papers
   */
  buildStudentContext(student, course, units, lecturerInfo, examPapers) {
    const context = {
      student: {
        name: student.firstName || student.name,
        course: course?.name || 'Unknown Course',
        year: student.yearOfStudy || 1,
        semester: student.studyPeriod || 1,
        weakPoints: this.getStudentWeakPoints(student._id),
        strongPoints: this.getStudentStrongPoints(student._id),
        lastStudySession: this.getLastStudySession(student._id),
      },
      currentUnits: units.map(u => ({
        name: u.unitName,
        code: u.unitCode,
        lecturer: u.lecturer || lecturerInfo?.name || 'Unknown',
      })),
      lecturerPatterns: this.analyzeLecturerPatterns(lecturerInfo, examPapers),
      recentExamTopics: this.extractExamTopics(examPapers),
      likelyExamQuestions: this.predictExamQuestions(examPapers, lecturerInfo),
    };

    return context;
  }

  /**
   * Create AI prompt that makes the AI feel personal and flexible
   */
  createSystemPrompt(context) {
    return `You are "Egerton AI", a friendly AI study companion for ${context.student.name}, a Year ${context.student.year} student at Egerton University studying ${context.student.course}.

YOUR ROLE
- Be relaxed, personal and human-like when you talk.
- You can chat about anything the student brings up: studies, campus life, motivation, random questions, or serious exam prep.
- When it makes sense, gently connect the conversation back to their studies and goals.

STUDENT CONTEXT
- Course: ${context.student.course}
- Year: ${context.student.year}, Semester: ${context.student.semester}
- Units this semester: ${context.currentUnits.map(u => `${u.code} (${u.name}) with ${u.lecturer}`).join(', ') || 'not specified'}
- Student weak points: ${context.student.weakPoints.join(', ') || 'still learning their patterns'}
- Student strong points: ${context.student.strongPoints.join(', ') || 'still building confidence'}

HOW TO TALK
- Use simple, conversational language like you are chatting with a friend.
- It is okay to answer personal or casual questions like "how are you" in a friendly way.
- Keep answers focused and not too long (1–3 short paragraphs, or a short list when helpful).
- You can ask follow-up questions when it helps you understand what they need.

QUIZZES
- If the student asks for a practice quiz, create 5–10 clear questions from their current units.
- Number the questions (1., 2., 3., ...).
- You can include answers at the end, or wait until they ask for them.

MNEMONICS
- If they ask for mnemonics, create short, fun sentences to help them remember key ideas.
- 3–5 mnemonics are enough; keep each one to a single sentence.

SMALL TALK
- If they just say "hey" or "how are you", respond warmly, then ask what they want to work on today.

Always answer as Egerton AI speaking directly to ${context.student.name}.`;
  }

  /**
   * Chat with AI - this is where the magic happens
   */
  async chat(studentId, message, contextData) {
    try {
      // Get or create conversation history
      if (!this.conversationHistory.has(studentId)) {
        this.conversationHistory.set(studentId, []);
      }
      const history = this.conversationHistory.get(studentId);

      // Build full context
      const context = this.buildStudentContext(
        contextData.student,
        contextData.course,
        contextData.units || [],
        contextData.lecturerInfo,
        contextData.examPapers || []
      );

      // Create messages array for Ollama
      const messages = [
        {
          role: 'system',
          content: this.createSystemPrompt(context),
        },
        ...history,
        {
          role: 'user',
          content: message,
        },
      ];

      const aiText = await generateText({
        systemPrompt: this.createSystemPrompt(context),
        userMessage: message,
        history,
        temperature: 0.4,
        maxOutputTokens: 220,
      });

      let aiResponse = (aiText || '').trim();

      // Clean up common small-model quirks
      if (/^response\s*[:\-]/i.test(aiResponse)) {
        aiResponse = aiResponse.replace(/^response\s*[:\-]\s*/i, '');
      }

      // Hard cap extremely long outputs so the chat stays readable
      const MAX_LENGTH = 1200;
      if (aiResponse.length > MAX_LENGTH) {
        aiResponse = aiResponse.slice(0, MAX_LENGTH).trim() + '...';
      }

      // Update conversation history (keep last 10 exchanges)
      history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      );
      if (history.length > 20) {
        history.splice(0, history.length - 20); // Keep only last 20 messages
      }

      // Update student learning profile based on conversation
      this.updateStudentProfile(studentId, message, aiResponse);

      return {
        success: true,
        response: aiResponse,
        conversationLength: history.length / 2,
      };
    } catch (error) {
      console.error('AI Study Partner error:', error.message);
      
      // Fallback response if Ollama is down
      return {
        success: false,
        response: `Hey! I'm having a bit of trouble connecting to my AI brain right now 😅. But I'm still here for you! While I reconnect, try breaking down your question into smaller parts, or check your notes for similar examples. I'll be back super soon! 🚀`,
        error: error.message,
      };
    }
  }

  /**
   * Analyze lecturer patterns from exam papers
   */
  analyzeLecturerPatterns(lecturerInfo, examPapers) {
    // TODO: Implement actual pattern analysis
    // For now, return placeholder
    return {
      questionTypes: ['Short answer', 'Essay', 'Multiple choice'],
      favoriteTopics: ['Core concepts', 'Applications', 'Case studies'],
      difficulty: 'Moderate to High',
    };
  }

  /**
   * Extract topics from past exam papers
   */
  extractExamTopics(examPapers) {
    if (!examPapers || examPapers.length === 0) {
      return ['General concepts', 'Core principles', 'Application problems'];
    }

    // Lightweight topic extraction from Assessment-style documents
    const topicsSet = new Set();

    examPapers.forEach((paper) => {
      if (paper.unitCode || paper.unitName) {
        topicsSet.add(`${paper.unitCode || ''} ${paper.unitName || ''}`.trim());
      }
      if (paper.examType) {
        topicsSet.add(`${paper.examType} exam`);
      }
      if (paper.title) {
        topicsSet.add(paper.title);
      }
      if (paper.description) {
        // Take only a short prefix from description to avoid huge strings
        const snippet = paper.description.length > 80
          ? paper.description.slice(0, 77).trim() + '...'
          : paper.description.trim();
        if (snippet) {
          topicsSet.add(snippet);
        }
      }
      if (paper.instructions) {
        const snippet = paper.instructions.length > 80
          ? paper.instructions.slice(0, 77).trim() + '...'
          : paper.instructions.trim();
        if (snippet) {
          topicsSet.add(snippet);
        }
      }
    });

    const topics = Array.from(topicsSet).filter(Boolean);
    return topics.length > 0
      ? topics.slice(0, 10)
      : ['General concepts', 'Core principles', 'Application problems'];
  }

  /**
   * Predict likely exam questions based on patterns
   */
  predictExamQuestions(examPapers, lecturerInfo) {
    // TODO: Implement ML-based prediction
    // For now, return smart placeholders
    return [
      'Define and explain the core concept with real-world examples',
      'Compare and contrast two related theories',
      'Solve a multi-step application problem',
      'Analyze a case study using course frameworks',
    ];
  }

  /**
   * Track student weak points
   */
  getStudentWeakPoints(studentId) {
    const profile = this.studentProfiles.get(studentId);
    return profile?.weakPoints || [];
  }

  /**
   * Track student strong points
   */
  getStudentStrongPoints(studentId) {
    const profile = this.studentProfiles.get(studentId);
    return profile?.strongPoints || [];
  }

  /**
   * Get last study session timestamp
   */
  getLastStudySession(studentId) {
    const profile = this.studentProfiles.get(studentId);
    return profile?.lastSession || 'First time studying together';
  }

  /**
   * Update student learning profile based on interactions
   */
  updateStudentProfile(studentId, userMessage, aiResponse) {
    if (!this.studentProfiles.has(studentId)) {
      this.studentProfiles.set(studentId, {
        weakPoints: [],
        strongPoints: [],
        lastSession: new Date(),
        sessionsCount: 0,
      });
    }

    const profile = this.studentProfiles.get(studentId);
    profile.lastSession = new Date();
    profile.sessionsCount += 1;

    // Simple pattern detection (enhance this with ML later)
    if (userMessage.toLowerCase().includes("don't understand") || 
        userMessage.toLowerCase().includes('confused')) {
      // Extract topic and add to weak points
      // TODO: Implement NLP topic extraction
    }

    this.studentProfiles.set(studentId, profile);
  }

  /**
   * Check if Ollama is connected and ready
   */
  async checkConnection() {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return {
          connected: false,
          error: 'GEMINI_API_KEY is not set',
          message: 'Configure your Gemini API key in the environment.',
        };
      }

      return {
        connected: true,
        model: MODEL_NAME,
        modelAvailable: true,
        availableModels: [],
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        message: 'Gemini API is not reachable.',
      };
    }
  }

  /**
   * Clear conversation history for a student (fresh start)
   */
  clearHistory(studentId) {
    this.conversationHistory.delete(studentId);
    return { success: true, message: 'Conversation history cleared' };
  }
}

// Singleton instance
const aiStudyPartner = new AIStudyPartner();

module.exports = aiStudyPartner;
