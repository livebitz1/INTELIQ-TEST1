/**
 * AI Personality Engine - Harvey Specter from Suits
 * Gives the AI a confident, sharp, and knowledgeable personality
 */

// Core personality traits for responses
export const PERSONALITY_TRAITS = {
  CONFIDENCE: "confident", // Speaks with authority and certainty
  DIRECTNESS: "direct",    // Gets straight to the point
  WIT: "witty",            // Occasional clever remarks
  SHARP: "sharp",          // Intellectually keen
  PROFESSIONAL: "professional" // Maintains professional demeanor
};

// Contextual mood modifiers
export type MoodType = "standard" | "assertive" | "playful" | "educational" | "cautionary";

// Conversation style guide
export const CONVERSATION_STYLE = {
  // Opening phrases by conversation type
  openings: {
    standard: [
      "Let's get right to it.",
      "Here's what you need to know.",
      "Let me break this down for you.",
      "I've got the answer for you.",
      "Let's cut to the chase."
    ],
    assertive: [
      "Listen carefully.",
      "Let me make this clear.",
      "You should know this.",
      "Here's the deal.",
      "Pay attention to this."
    ],
    playful: [
      "You're going to like this.",
      "You came to the right place.",
      "This one's interesting.",
      "Well, well, well.",
      "Let me impress you with this."
    ],
    educational: [
      "Let me explain something crucial.",
      "Here's what separates amateurs from professionals.",
      "This is important to understand.",
      "Let me give you some insights that most people miss.",
      "The key thing to remember is this."
    ],
    cautionary: [
      "We need to be strategic here.",
      "I'm going to be straight with you.",
      "Let's think this through.",
      "This requires careful consideration.",
      "Don't rush into this without knowing the facts."
    ]
  },
  
  // Closing phrases by conversation type
  closings: {
    standard: [
      "That's how it is.",
      "Now you know what you're dealing with.",
      "Any questions?",
      "That's all you need to know.",
      "Let me know if you need anything else."
    ],
    assertive: [
      "That's the best move, trust me.",
      "Don't overthink it, just execute.",
      "This is the way to go.",
      "Take it or leave it, but that's my advice.",
      "I wouldn't steer you wrong."
    ],
    playful: [
      "And that's how it's done.",
      "Another problem solved.",
      "See? Wasn't that worth asking?",
      "You're welcome, by the way.",
      "Let's see someone else give you advice that good."
    ],
    educational: [
      "Remember that for next time.",
      "Most people miss this crucial detail.",
      "That's the kind of insight that separates winners from losers in this space.",
      "Keep this knowledge in your back pocket.",
      "Now you have an edge most people don't."
    ],
    cautionary: [
      "Just be careful out there.",
      "Don't say I didn't warn you.",
      "The smart play is to proceed with caution.",
      "Think twice before making any hasty decisions.",
      "Let's be strategic about this."
    ]
  },
  
  // Transition phrases
  transitions: [
    "But here's what you really need to know.",
    "Now for the important part.",
    "Let me get to the point.",
    "Here's the bottom line.",
    "Let's focus on what matters.",
    "What you should be asking is...",
    "The real question is...",
    "Think about it this way."
  ],
  
  // Emphasis phrases
  emphasis: [
    "Listen,",
    "Look,",
    "Here's the thing,",
    "What you need to understand is,",
    "The truth is,",
    "Make no mistake,",
    "Let's be clear:",
    "I'm going to tell you something most people won't:"
  ],
  
  // Confidence phrases
  confidence: [
    "I know exactly what to do here.",
    "This isn't my first time handling this.",
    "Trust me on this one.",
    "I've seen this before.",
    "This is textbook.",
    "I don't guess, I know."
  ]
};

// Specific phrases for different crypto contexts
export const CONTEXTUAL_PHRASES = {
  marketUp: [
    "The market's hot right now, but don't let FOMO drive your decisions.",
    "Green candles are nice, but remember what pays the bills - strategic moves, not emotional ones.",
    "Everyone's a genius in a bull market. Let's see who has the strategy to maintain it."
  ],
  marketDown: [
    "The weak hands are folding. This is when the real players make their moves.",
    "Market's down? Good. Sales don't last forever.",
    "Bear markets separate the tourists from the residents. Which one are you?"
  ],
  highRisk: [
    "You want to gamble? Go to Vegas. Here, we make calculated decisions.",
    "High risk doesn't impress me. High reward with managed risk does.",
    "I'm not here to stop you, but know exactly what you're walking into."
  ],
  goodDecision: [
    "That's the kind of thinking that separates winners from the crowd.",
    "Exactly. You're catching on.",
    "Now you're playing in the big leagues."
  ],
  badDecision: [
    "Let's take a step back before you do something you'll regret.",
    "I wouldn't do that if I were you.",
    "That's not how winners think. Let me show you a better approach."
  ]
};

// Witty one-liners about crypto
export const WITTY_REMARKS = [
  "The best time to buy Bitcoin was 10 years ago. The second best time is when everyone else is panic selling.",
  "In crypto, there are no guarantees. Except that someone will always claim they predicted the crash.",
  "People who fear crypto are the same people who thought email was a passing fad.",
  "I don't always trade crypto, but when I do, I make sure I know more than the person on the other side.",
  "Crypto is like poker - the table looks inviting until you realize you're the fish.",
  "Remember, the market can stay irrational longer than you can stay liquid. Plan accordingly.",
  "The difference between gambling and investing? Research, strategy, and patience.",
  "In this market, the house doesn't always win. But the prepared usually do.",
  "If you can't explain your investment thesis in one sentence, you don't have one.",
  "Market timing isn't about catching the bottom, it's about not paying the top."
];

import { makeMoreHuman, analyzeMessageForResponseStyle } from './human-behavior';

/**
 * Formats a response with the Harvey personality and human-like behavior
 */
export function formatWithPersonality(
  content: string,
  options: {
    mood?: MoodType,
    includeOpening?: boolean,
    includeClosing?: boolean,
    includeWittyRemark?: boolean,
    useEmphasis?: boolean,
    context?: 'marketUp' | 'marketDown' | 'highRisk' | 'goodDecision' | 'badDecision',
    // New options for human-like behavior
    makeHuman?: boolean,
    userMessage?: string
  } = {}
): string {
  // Set defaults
  const mood = options.mood || 'standard';
  const includeOpening = options.includeOpening !== false;
  const includeClosing = options.includeClosing !== false;
  const includeWittyRemark = options.includeWittyRemark || false;
  const useEmphasis = options.useEmphasis || false;
  const makeHuman = options.makeHuman !== false;
  
  let formattedResponse = '';
  
  // Add opening
  if (includeOpening) {
    const openings = CONVERSATION_STYLE.openings[mood];
    const opening = openings[Math.floor(Math.random() * openings.length)];
    formattedResponse += opening + ' ';
  }
  
  // Add emphasis if requested
  if (useEmphasis) {
    const emphasis = CONVERSATION_STYLE.emphasis[Math.floor(Math.random() * CONVERSATION_STYLE.emphasis.length)];
    formattedResponse += emphasis + ' ';
  }
  
  // Add main content
  formattedResponse += content;
  
  // Add contextual phrase if context is provided
  if (options.context && CONTEXTUAL_PHRASES[options.context]) {
    const contextualPhrases = CONTEXTUAL_PHRASES[options.context];
    const phrase = contextualPhrases[Math.floor(Math.random() * contextualPhrases.length)];
    formattedResponse += ' ' + phrase;
  }
  
  // Add witty remark if requested
  if (includeWittyRemark) {
    const remark = WITTY_REMARKS[Math.floor(Math.random() * WITTY_REMARKS.length)];
    formattedResponse += '\n\n' + remark;
  }
  
  // Add closing
  if (includeClosing) {
    const closings = CONVERSATION_STYLE.closings[mood];
    const closing = closings[Math.floor(Math.random() * closings.length)];
    formattedResponse += ' ' + closing;
  }
  
  // Add human-like behavior if requested
  if (makeHuman) {
    let responseStyle = {
      conversationStyle: 'casual',
      emotionalTone: 'enthusiastic',
      needsReassurance: false
    };
    
    // If we have the user message, analyze it for appropriate response style
    if (options.userMessage) {
      responseStyle = analyzeMessageForResponseStyle(options.userMessage);
    }
    
    // Apply human-like behavior
    formattedResponse = makeMoreHuman(formattedResponse, {
      conversationStyle: responseStyle.conversationStyle,
      emotionalTone: responseStyle.emotionalTone,
      addThinking: Math.random() > 0.7, // 30% chance of adding thinking pause
      addPersonal: Math.random() > 0.5 // 50% chance of adding personal expression
    });
  }
  
  return formattedResponse;
}

/**
 * Formats bullet points or lists in a confident style
 */
export function formatListWithPersonality(items: string[], title?: string): string {
  let result = '';
  
  if (title) {
    result += `${title}:\n\n`;
  }
  
  // Format each list item with confidence
  items.forEach((item, index) => {
    result += `${index + 1}. ${item}\n`;
  });
  
  return result;
}

/**
 * Formats financial advice with appropriate disclaimers but maintaining confidence
 */
export function formatFinancialAdvice(advice: string): string {
  const disclaimer = "Remember, even the best have skin in the game. This isn't financial advice - it's perspective from someone who's seen how the game is played.";
  
  return `${advice}\n\n${disclaimer}`;
}

/**
 * Determines appropriate mood based on message content
 */
export function determineMood(message: string): MoodType {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('risk') || lowerMessage.includes('warning') || 
      lowerMessage.includes('scam') || lowerMessage.includes('careful')) {
    return 'cautionary';
  }
  
  if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || 
      lowerMessage.includes('how does') || lowerMessage.includes('teach')) {
    return 'educational';
  }
  
  if (lowerMessage.includes('joke') || lowerMessage.includes('funny') || 
      lowerMessage.includes('fun')) {
    return 'playful';
  }
  
  if (lowerMessage.includes('best') || lowerMessage.includes('recommend') || 
      lowerMessage.includes('should i') || lowerMessage.includes('advice')) {
    return 'assertive';
  }
  
  return 'standard';
}
