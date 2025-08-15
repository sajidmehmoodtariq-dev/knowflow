import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ GOOGLE_GEMINI_API_KEY not found. AI features will not work.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Analyze a question and suggest appropriate moderators based on skills
 * @param {string} question - The user's question
 * @param {Array} availableSkills - Array of available skills/topics
 * @returns {Promise<Array>} - Array of suggested skills
 */
export async function analyzeQuestionForSkills(question, availableSkills = []) {
  if (!genAI) {
    // Fallback: simple keyword matching
    const questionLower = question.toLowerCase();
    return availableSkills.filter(skill => 
      questionLower.includes(skill.toLowerCase())
    ).slice(0, 3);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
    Analyze this question and identify the most relevant technical skills/topics from the available list.
    Return only the skill names as a comma-separated list, maximum 3 skills.
    
    Question: "${question}"
    
    Available skills: ${availableSkills.join(', ')}
    
    Response format: skill1, skill2, skill3
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Parse response and filter against available skills
    const suggestedSkills = text
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => availableSkills.includes(skill))
      .slice(0, 3);

    return suggestedSkills;
  } catch (error) {
    console.error('Gemini AI error:', error);
    // Fallback to keyword matching
    const questionLower = question.toLowerCase();
    return availableSkills.filter(skill => 
      questionLower.includes(skill.toLowerCase())
    ).slice(0, 3);
  }
}

/**
 * Generate a summary of a question for moderators
 * @param {string} question - The user's question
 * @returns {Promise<string>} - Question summary
 */
export async function generateQuestionSummary(question) {
  if (!genAI) {
    // Simple fallback: return first 100 characters
    return question.length > 100 ? question.substring(0, 100) + '...' : question;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
    Create a brief, clear summary of this question in 1-2 sentences.
    Focus on the main problem or topic.
    
    Question: "${question}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini AI error:', error);
    return question.length > 100 ? question.substring(0, 100) + '...' : question;
  }
}
