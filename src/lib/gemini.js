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
    
    // Parse response and filter against available skills (case-insensitive)
    const suggestedSkills = text
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => {
        // Case-insensitive matching
        return availableSkills.some(availableSkill => 
          availableSkill.toLowerCase() === skill.toLowerCase()
        );
      })
      .map(skill => {
        // Return the actual skill name from availableSkills (preserving case)
        return availableSkills.find(availableSkill => 
          availableSkill.toLowerCase() === skill.toLowerCase()
        );
      })
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
 * @param {string} question - The user's question content
 * @param {string} title - The question title (optional)
 * @returns {Promise<string>} - Question summary/description
 */
export async function generateQuestionSummary(question, title = '') {
  if (!genAI) {
    // Simple fallback: return first 150 characters
    return question.length > 150 ? question.substring(0, 150) + '...' : question;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const fullContent = title ? `Title: ${title}\n\nContent: ${question}` : question;
    
    const prompt = `
    Create a clear, professional summary/description of this question in 1-3 sentences.
    Focus on:
    - The main problem or issue being asked about
    - Key technical details or context
    - What kind of help the person needs
    
    Make it helpful for moderators to quickly understand the question.
    Keep it under 250 characters.
    
    ${fullContent}
    
    Summary:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();
    
    // Ensure it's not too long
    return summary.length > 290 ? summary.substring(0, 287) + '...' : summary;
  } catch (error) {
    console.error('Gemini AI error:', error);
    // Better fallback: try to extract first sentence or meaningful chunk
    const sentences = question.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      return firstSentence.length > 150 ? firstSentence.substring(0, 147) + '...' : firstSentence;
    }
    return question.length > 150 ? question.substring(0, 147) + '...' : question;
  }
}
