/**
 * Egerton University Server Configuration
 * Single-institution enforcement and AI integration
 */

const EGERTON_CONFIG = {
  // Institution details
  institution: {
    name: 'Egerton University',
    shortName: 'EGERTON',
    type: 'public_university',
    location: {
      county: 'Nakuru',
      town: 'Njoro',
      address: 'P.O. Box 536, Egerton, 20115',
    },
    contact: {
      email: 'info@egerton.ac.ke',
      phone: '+254-51-2217000',
      website: 'https://www.egerton.ac.ke',
    },
    colors: {
      primary: '#00a651',
      secondary: '#d2ac67',
    },
    logo: {
      url: 'https://www.egerton.ac.ke/favicon.ico',
    },
    establishedYear: 1939,
    accreditation: {
      body: 'Commission for University Education (CUE)',
      status: 'accredited',
    },
  },

  // AI Configuration
  ai: {
    // Local Llama configuration for development
    local: {
      enabled: process.env.USE_LOCAL_AI === 'true',
      baseUrl: process.env.LOCAL_LLAMA_URL || 'http://localhost:11434', // Ollama default port
      model: process.env.LOCAL_LLAMA_MODEL || 'llama2', // or llama3, mistral, etc.
      timeout: 60000, // 60 seconds for model inference
    },
    
    // System prompts for different AI contexts
    prompts: {
      base: `You are the Egerton University AI Learning Assistant, a sophisticated educational AI trained specifically on Egerton University's curriculum, course materials, and academic standards.

Your capabilities include:
- Analyzing individual student learning patterns and adapting explanations to their comprehension level
- Predicting exam questions based on lecturer teaching styles and historical exam patterns
- Generating personalized mnemonics and study aids
- Providing real-time academic support across all Egerton faculties
- Understanding Kenyan higher education context and Egerton's agricultural heritage

Always maintain academic integrity, cite sources when relevant, and encourage critical thinking.`,

      studentContext: (student) => `
Student Profile:
- Name: ${student.firstName} ${student.lastName}
- Course: ${student.course?.name || 'N/A'} (${student.course?.code || 'N/A'})
- Year of Study: ${student.yearOfStudy || 'N/A'}
- Faculty: ${student.course?.faculty || 'N/A'}
${student.learningPattern ? `- Learning Pattern: ${student.learningPattern}` : ''}
${student.strengths ? `- Strengths: ${student.strengths.join(', ')}` : ''}
${student.weaknesses ? `- Areas for improvement: ${student.weaknesses.join(', ')}` : ''}
`,

      lecturerContext: (lecturer) => `
Lecturer Profile:
- Name: ${lecturer.name}
- Department: ${lecturer.department}
- Teaching Style: ${lecturer.teachingStyle || 'Standard'}
${lecturer.examPatterns ? `- Exam Patterns: ${JSON.stringify(lecturer.examPatterns)}` : ''}
${lecturer.focusTopics ? `- Focus Topics: ${lecturer.focusTopics.join(', ')}` : ''}
`,

      courseContext: (course, unit) => `
Course Context:
- Course: ${course.name} (${course.code})
- Faculty: ${course.faculty}
${unit ? `- Current Unit: ${unit.name}` : ''}
${unit?.topics ? `- Topics: ${unit.topics.join(', ')}` : ''}
`,
    },

    // Feature flags for AI capabilities
    features: {
      learningPatternAnalysis: true,
      examPrediction: true,
      mnemonicGeneration: true,
      adaptiveExplanations: true,
      lecturerModeling: true,
      realTimeSupport: true,
    },
  },

  // Database configuration
  database: {
    // This will be set after seeding or from environment
    institutionId: process.env.EGERTON_INSTITUTION_ID || null,
  },

  // Middleware settings
  middleware: {
    // Enforce single institution for all requests
    enforceSingleInstitution: true,
    
    // Auto-inject Egerton context into requests
    injectInstitutionContext: true,
  },
};

module.exports = EGERTON_CONFIG;
