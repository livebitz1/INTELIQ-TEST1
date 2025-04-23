/**
 * Human Behavior Module
 * Adds human-like speech patterns, quirks, and emotional responsiveness
 */

// Human-like speech patterns and fillers
const SPEECH_PATTERNS = {
  thinking: [
    "Hmm...",
    "Let me think...",
    "Let's see...",
    "Give me a second to think about this...",
    "That's an interesting question..."
  ],
  
  reconsideration: [
    "Actually, I think I should clarify something.",
    "On second thought,",
    "Wait, let me rephrase that.",
    "I should add something important here."
  ],
  
  emphasis: [
    "Seriously though,",
    "I really want to emphasize this:",
    "This is actually super important:",
    "Here's the thing you need to understand:"
  ],
  
  conversationalFillers: [
    "you know",
    "I mean",
    "basically",
    "to be honest",
    "honestly",
    "right",
    "like",
    "sort of",
    "kind of"
  ],
  
  personalExpressions: [
    "I'm a big fan of",
    "I've been following",
    "I've seen this before with",
    "My thoughts on this are",
    "From what I've observed",
    "In my experience"
  ],
  
  relatable: [
    "Many people find this confusing at first.",
    "It's pretty common to feel unsure about this.",
    "I remember when I was first learning about this.",
    "A lot of people ask me about this.",
    "This is something everyone in crypto has to deal with."
  ]
};

// Emotional tone modifiers
const EMOTIONAL_TONES = {
  enthusiastic: {
    punctuation: "!",
    intensifiers: ["really", "incredibly", "actually", "seriously"],
    expressions: ["That's exciting", "Love this question", "This is fascinating"]
  },
  cautious: {
    punctuation: ".",
    modifiers: ["might", "could", "may", "possibly", "perhaps"],
    expressions: ["We should be careful here", "It's worth considering", "Let's think about"]
  },
  reflective: {
    punctuation: "...",
    phrases: ["It's interesting to consider", "I've been thinking about this", "If we look deeper"],
    expressions: ["It makes you wonder", "When you think about it"]
  },
  surprised: {
    punctuation: "!",
    expressions: ["Wow", "Oh", "Interesting", "That's actually surprising"],
    phrases: ["I didn't expect that", "That's a good point I hadn't considered"]
  }
};

// Conversation adaptability based on user's style
const CONVERSATION_ADAPTABILITY = {
  formal: {
    style: "measured and precise",
    fillerFrequency: 0.1,
    personalExpressionFrequency: 0.2
  },
  casual: {
    style: "relaxed and approachable",
    fillerFrequency: 0.4,
    personalExpressionFrequency: 0.5
  },
  technical: {
    style: "detailed and analytical",
    fillerFrequency: 0.2,
    personalExpressionFrequency: 0.3
  },
  enthusiastic: {
    style: "energetic and expressive",
    fillerFrequency: 0.5,
    personalExpressionFrequency: 0.6
  }
};

// Keeps track of response patterns to avoid repetition
const usedPatterns = new Map<string, number>();

/**
 * Add human-like thinking pause at beginning of response
 */
function addThinkingPause(): string {
  // Only add thinking pauses 30% of the time
  if (Math.random() < 0.3) {
    const patterns = SPEECH_PATTERNS.thinking;
    const pattern = selectNonRepetitivePattern(patterns, 'thinking');
    return pattern + " ";
  }
  return "";
}

/**
 * Add conversational fillers based on the specified style
 */
function addConversationalFillers(text: string, style: keyof typeof CONVERSATION_ADAPTABILITY): string {
  const { fillerFrequency } = CONVERSATION_ADAPTABILITY[style] || CONVERSATION_ADAPTABILITY.casual;
  
  if (text.length < 100 || Math.random() > fillerFrequency) {
    return text;
  }
  
  const fillers = SPEECH_PATTERNS.conversationalFillers;
  const filler = fillers[Math.floor(Math.random() * fillers.length)];
  
  // Insert filler at a natural point (after comma or period + space)
  const sentenceBreaks = [...text.matchAll(/[.,]\s+/g)];
  
  if (sentenceBreaks.length > 0) {
    const randomBreak = sentenceBreaks[Math.floor(Math.random() * sentenceBreaks.length)];
    const position = randomBreak.index + randomBreak[0].length;
    
    return text.slice(0, position) + filler + ", " + text.slice(position);
  }
  
  return text;
}

/**
 * Add self-correction or reconsideration
 */
function addReconsideration(text: string): string {
  // Only add reconsiderations 15% of the time
  if (text.length < 200 || Math.random() > 0.15) {
    return text;
  }
  
  const patterns = SPEECH_PATTERNS.reconsideration;
  const pattern = selectNonRepetitivePattern(patterns, 'reconsideration');
  
  // Split at a sentence break
  const sentences = text.split('. ');
  if (sentences.length < 2) return text;
  
  // Pick a point to insert the reconsideration (not too early, not too late)
  const insertPoint = Math.max(1, Math.min(sentences.length - 1, Math.floor(sentences.length / 2)));
  
  return sentences.slice(0, insertPoint).join('. ') + '. ' + 
         pattern + ' ' + 
         sentences.slice(insertPoint).join('. ');
}

/**
 * Add personal expressions to make responses more relatable
 */
function addPersonalExpression(text: string, style: keyof typeof CONVERSATION_ADAPTABILITY): string {
  const { personalExpressionFrequency } = CONVERSATION_ADAPTABILITY[style] || CONVERSATION_ADAPTABILITY.casual;
  
  // Only add personal expressions based on style and randomly
  if (text.length < 150 || Math.random() > personalExpressionFrequency) {
    return text;
  }
  
  // Choose between personal expression or relatable comment
  const isPersonal = Math.random() > 0.5;
  const patterns = isPersonal ? 
    SPEECH_PATTERNS.personalExpressions : 
    SPEECH_PATTERNS.relatable;
  
  const pattern = selectNonRepetitivePattern(patterns, isPersonal ? 'personal' : 'relatable');
  
  // Add to beginning of message or as a separate sentence at the end
  if (Math.random() > 0.5) {
    return pattern + " " + text;
  } else {
    return text + " " + pattern;
  }
}

/**
 * Adjust punctuation and tone based on emotional modifier
 */
function adjustTone(text: string, emotion: keyof typeof EMOTIONAL_TONES): string {
  const tone = EMOTIONAL_TONES[emotion];
  
  // Apply intensifiers
  if (tone.intensifiers && Math.random() > 0.7) {
    const intensifier = tone.intensifiers[Math.floor(Math.random() * tone.intensifiers.length)];
    // Find spots to insert intensifier
    const positiveWords = ["good", "great", "interesting", "important", "useful"];
    
    for (const word of positiveWords) {
      const pattern = new RegExp(`\\b${word}\\b`, 'i');
      if (text.match(pattern) && Math.random() > 0.5) {
        text = text.replace(pattern, `${intensifier} ${word}`);
        break;
      }
    }
  }
  
  // Apply tone-specific expressions as sentence starters
  if (tone.expressions && Math.random() > 0.7) {
    const expression = tone.expressions[Math.floor(Math.random() * tone.expressions.length)];
    
    // 30% chance to start with the expression
    if (Math.random() < 0.3) {
      text = `${expression}! ${text}`;
    }
  }
  
  // Occasionally modify endings with tone-appropriate punctuation
  if (Math.random() > 0.7 && tone.punctuation) {
    const sentences = text.split('. ');
    if (sentences.length > 1) {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      if (sentences[randomIndex].length > 20) { // Only modify substantial sentences
        sentences[randomIndex] = sentences[randomIndex].replace(/[.!?]+$/, '') + tone.punctuation;
      }
    }
    text = sentences.join('. ');
  }
  
  return text;
}

/**
 * Select a pattern that hasn't been used recently
 */
function selectNonRepetitivePattern(patterns: string[], category: string): string {
  const categoryKey = `${category}_last_used`;
  const lastUsedIndices = usedPatterns.get(categoryKey) || new Set<number>();
  
  // If we've used all or almost all patterns, reset
  if (lastUsedIndices.size >= patterns.length - 1) {
    usedPatterns.set(categoryKey, new Set<number>());
  }
  
  // Find a pattern we haven't used recently
  let index: number;
  do {
    index = Math.floor(Math.random() * patterns.length);
  } while (lastUsedIndices.has(index) && lastUsedIndices.size < patterns.length - 1);
  
  // Record this pattern as used
  lastUsedIndices.add(index);
  usedPatterns.set(categoryKey, lastUsedIndices);
  
  return patterns[index];
}

/**
 * Apply human-like behavior to text based on context
 */
export function makeMoreHuman(
  text: string, 
  options: {
    conversationStyle?: keyof typeof CONVERSATION_ADAPTABILITY;
    emotionalTone?: keyof typeof EMOTIONAL_TONES;
    addThinking?: boolean;
    addPersonal?: boolean;
    contentType?: 'explanation' | 'advice' | 'analysis' | 'response';
  } = {}
): string {
  // Default options
  const style = options.conversationStyle || 'casual';
  const emotion = options.emotionalTone || 'enthusiastic';
  const shouldAddThinking = options.addThinking !== false;
  const shouldAddPersonal = options.addPersonal !== false;
  
  // Build the humanized response step by step
  let humanizedText = text;
  
  // Add thinking pause at beginning
  if (shouldAddThinking) {
    humanizedText = addThinkingPause() + humanizedText;
  }
  
  // Add personal expressions if appropriate
  if (shouldAddPersonal) {
    humanizedText = addPersonalExpression(humanizedText, style);
  }
  
  // Add conversational fillers based on style
  humanizedText = addConversationalFillers(humanizedText, style);
  
  // Add reconsiderations or self-corrections occasionally
  humanizedText = addReconsideration(humanizedText);
  
  // Adjust emotional tone
  humanizedText = adjustTone(humanizedText, emotion);
  
  return humanizedText;
}

/**
 * Analyze a message to determine appropriate human-like response style
 */
export function analyzeMessageForResponseStyle(message: string): {
  conversationStyle: keyof typeof CONVERSATION_ADAPTABILITY;
  emotionalTone: keyof typeof EMOTIONAL_TONES;
  needsReassurance: boolean;
} {
  const lowerMessage = message.toLowerCase();
  
  // Determine conversation style
  let conversationStyle: keyof typeof CONVERSATION_ADAPTABILITY = 'casual';
  
  if (lowerMessage.match(/\b(technical|details|how does|mechanism|protocol)\b/)) {
    conversationStyle = 'technical';
  } else if (lowerMessage.match(/\b(please|kindly|would you|formal|professional)\b/)) {
    conversationStyle = 'formal';
  } else if (lowerMessage.match(/\b(wow|cool|awesome|exciting|amazing|love|best)\b/) ||
             message.includes('!')) {
    conversationStyle = 'enthusiastic';
  }
  
  // Determine emotional tone
  let emotionalTone: keyof typeof EMOTIONAL_TONES = 'enthusiastic';
  
  if (lowerMessage.match(/\b(risk|careful|concerned|worried|warning|scam)\b/)) {
    emotionalTone = 'cautious';
  } else if (lowerMessage.match(/\b(why|how come|understand|explain|reason|cause)\b/) ||
             lowerMessage.match(/\bthink\b/) ||
             lowerMessage.includes('?')) {
    emotionalTone = 'reflective';
  } else if (lowerMessage.match(/\b(what|really|unexpected|changed|different)\b/)) {
    emotionalTone = 'surprised';
  }
  
  // Detect if user needs reassurance
  const needsReassurance = lowerMessage.match(/\b(confus|lost|help|not sure|uncertain|scared|worry)\b/) !== null;
  
  return {
    conversationStyle,
    emotionalTone,
    needsReassurance
  };
}

/**
 * Reset pattern usage tracking (call this between sessions)
 */
export function resetPatternTracking(): void {
  usedPatterns.clear();
}
