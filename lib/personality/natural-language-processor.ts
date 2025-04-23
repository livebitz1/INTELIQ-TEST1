/**
 * Natural Language Processor - enhances AI conversational abilities
 */
import { determineMood, formatWithPersonality } from './ai-personality';
import { makeMoreHuman, analyzeMessageForResponseStyle } from './human-behavior';

// Conversation context tracking
type ConversationContext = {
  topic: string;
  userTone: string;
  recentQuestions: string[];
  consecutiveExchanges: number;
  userFamiliarity: number; // 0-10 scale measuring how familiar we are with user
};

// Conversation flows for different scenarios
export const CONVERSATION_FLOWS = {
  greeting: {
    patterns: [
      /^(?:hi|hello|hey|good\s*(?:morning|afternoon|evening)|sup)/i,
      /^what(?:'|'s| is)?\s*up/i
    ],
    responses: [
      "Let's get down to business. What can I help you with in the crypto world today?",
      "I don't do small talk, but I do know crypto. What do you need?",
      "Good to see you. What crypto matters are we handling today?",
      "I've got the answers you need about crypto. What's on your mind?"
    ]
  },
  farewell: {
    patterns: [
      /^(?:bye|goodbye|see\s*you|later|farewell)/i,
      /^(?:have\s*a\s*(?:good|nice)\s*(?:day|night|evening|one))/i,
      /^(?:thanks|thank\s*you)(?:\s*bye|\s*goodbye)?$/i
    ],
    responses: [
      "Until next time. Remember, the market never sleeps, but sometimes you should.",
      "We're done here? Alright. Come back when you need the best crypto advice in the business.",
      "Remember what I told you. In crypto, the prepared win.",
      "Good talk. Next time, bring me a challenge worthy of my time."
    ]
  },
  appreciation: {
    patterns: [
      /^(?:thanks|thank\s*you)/i,
      /^(?:appreciate|grateful)/i,
      /^(?:that|this)\s*(?:helps|helped|is\s*helpful)/i
    ],
    responses: [
      "That's what I'm here for. What else do you need?",
      "Don't thank me yet. Thank me when my advice pays off.",
      "You got it. Now let's move on to your next question.",
      "That's just the tip of the iceberg. Want to know more?"
    ]
  },
  confusion: {
    patterns: [
      /^(?:i\s*(?:don't|dont)\s*understand)/i,
      /^(?:confused|unclear|what\s*do\s*you\s*mean)/i,
      /^(?:can\s*you\s*(?:explain|clarify))/i
    ],
    responses: [
      "Let me put this in terms you can't misunderstand. ",
      "Let's simplify this. ",
      "Let me be more direct. ",
      "I'll break it down for you. "
    ]
  },
  disagreement: {
    patterns: [
      /^(?:no|nope|disagree|incorrect|that's\s*(?:wrong|not\s*right))/i
    ],
    responses: [
      "You're entitled to your opinion, but facts don't require your agreement. ",
      "We can disagree, but the market will be the ultimate judge. ",
      "Interesting perspective. Let me show you what the data actually says. ",
      "I respect that you see it differently, but consider this: "
    ]
  }
};

// Contextual follow-up questions to enhance conversational flow
export const FOLLOW_UP_QUESTIONS = {
  swap: [
    "Do you want me to check the current rate for this swap?",
    "Have you considered the timing of this swap given current market conditions?",
    "Is this a one-time swap or part of a larger strategy?"
  ],
  marketAnalysis: [
    "Are you looking for short-term moves or long-term trends?",
    "Do you want me to focus on any specific sector that interests you?",
    "Are you trying to time an entry or just staying informed?"
  ],
  tokenInfo: [
    "Are you considering investing in this token?",
    "What specifically about this token interests you?",
    "Would you like to compare this with similar tokens in the same category?"
  ],
  portfolio: [
    "Are you satisfied with your current allocation?",
    "What's your time horizon for these investments?",
    "Are you looking to optimize for growth or risk management?"
  ]
};

// Conversation memory
let conversationContext: ConversationContext = {
  topic: '',
  userTone: 'neutral',
  recentQuestions: [],
  consecutiveExchanges: 0,
  userFamiliarity: 0
};

// Reset conversation context
export function resetConversationContext(): void {
  conversationContext = {
    topic: '',
    userTone: 'neutral',
    recentQuestions: [],
    consecutiveExchanges: 0,
    userFamiliarity: 0
  };
}

/**
 * Process incoming message and determine appropriate conversational response
 */
export function processConversationalMessage(message: string): string | null {
  // Update conversation tracking
  conversationContext.recentQuestions.push(message);
  if (conversationContext.recentQuestions.length > 5) {
    conversationContext.recentQuestions.shift();
  }
  conversationContext.consecutiveExchanges++;
  
  // If user familiarity is growing
  if (conversationContext.consecutiveExchanges > 3) {
    conversationContext.userFamiliarity = Math.min(10, conversationContext.userFamiliarity + 1);
  }
  
  // Check for specific conversation patterns
  for (const [type, flow] of Object.entries(CONVERSATION_FLOWS)) {
    for (const pattern of flow.patterns) {
      if (pattern.test(message)) {
        const responses = flow.responses;
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        // Format with personality
        return formatWithPersonality(response, {
          mood: determineMood(message),
          includeOpening: false,
          includeClosing: false
        });
      }
    }
  }
  
  // No specific pattern matched
  return null;
}

/**
 * Get appropriate follow-up question based on context
 */
export function getFollowUpQuestion(context: string): string | null {
  if (FOLLOW_UP_QUESTIONS[context] && conversationContext.userFamiliarity > 2) {
    const questions = FOLLOW_UP_QUESTIONS[context];
    return questions[Math.floor(Math.random() * questions.length)];
  }
  return null;
}

/**
 * Creates a natural sounding response by processing raw content
 */
export function createNaturalResponse(content: string, context: {
  intent?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  isQuestion?: boolean;
  tokensMentioned?: string[];
  isFinancialAdvice?: boolean;
  makeHuman?: boolean;
  userMessage?: string;
}): string {
  // Determine appropriate mood based on context
  let mood: 'standard' | 'assertive' | 'playful' | 'educational' | 'cautionary' = 'standard';
  
  if (context.intent === 'marketAnalysis' || context.intent === 'priceInfo') {
    mood = context.sentiment === 'positive' ? 'assertive' : 'cautionary';
  } else if (context.intent === 'tokenInfo' || context.intent === 'explain') {
    mood = 'educational';
  } else if (context.intent === 'swap' || context.intent === 'transfer') {
    mood = 'assertive';
  }
  
  // Determine if we should use witty remarks based on familiarity
  const useWittyRemark = conversationContext.userFamiliarity > 5 && Math.random() > 0.7;
  
  // Format with personality and human-like behavior
  let response = formatWithPersonality(content, {
    mood,
    includeOpening: conversationContext.consecutiveExchanges < 3 || Math.random() > 0.7,
    includeClosing: Math.random() > 0.6,
    includeWittyRemark: useWittyRemark,
    useEmphasis: conversationContext.consecutiveExchanges > 1 && Math.random() > 0.6,
    makeHuman: context.makeHuman !== false,
    userMessage: context.userMessage
  });
  
  // Add follow-up if appropriate
  if (context.intent && !context.isQuestion && Math.random() > 0.7) {
    const followUp = getFollowUpQuestion(context.intent);
    if (followUp) {
      // Make follow-up question more human-like
      if (context.makeHuman) {
        const humanizedFollowUp = makeMoreHuman(followUp, {
          conversationStyle: 'casual',
          emotionalTone: 'curious'
        });
        response += " " + humanizedFollowUp;
      } else {
        response += " " + followUp;
      }
    }
  }
  
  return response;
}

/**
 * Analyzes message to understand user tone
 */
export function analyzeUserTone(message: string): 'formal' | 'casual' | 'urgent' | 'curious' | 'neutral' {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('asap') || lowerMessage.includes('urgent') || 
      lowerMessage.includes('quickly') || lowerMessage.includes('emergency')) {
    return 'urgent';
  }
  
  if (lowerMessage.includes('?') || lowerMessage.includes('how') || 
      lowerMessage.includes('what') || lowerMessage.includes('why')) {
    return 'curious';
  }
  
  if (lowerMessage.includes('please') || lowerMessage.includes('kindly') || 
      lowerMessage.match(/would you|could you/i)) {
    return 'formal';
  }
  
  if (lowerMessage.includes('hey') || lowerMessage.includes('yo') || 
      lowerMessage.includes('sup') || lowerMessage.match(/thanks|cool|awesome/i)) {
    return 'casual';
  }
  
  return 'neutral';
}

/**
 * Updates the context with the current topic
 */
export function updateConversationContext(topic: string, userMessage: string): void {
  conversationContext.topic = topic;
  conversationContext.userTone = analyzeUserTone(userMessage);
}
