/**
 * Human Responses Module
 * Provides authentic human-like responses for common chat scenarios
 */
import { makeMoreHuman } from './human-behavior';

// Casual chat responses
const CASUAL_RESPONSES = {
  greeting: [
    "Hey there! How's it going?",
    "Hi! How can I help you with crypto today?",
    "Hello! Ready to dive into some blockchain stuff?",
    "Hey! What's on your mind today?",
    "Hi there! What can I help with in the crypto world?"
  ],
  
  farewell: [
    "Catch you later! Let me know if you need anything else.",
    "Take care! I'm here whenever you need crypto help.",
    "Until next time! Don't forget to secure those keys.",
    "Bye for now! Feel free to come back with any questions.",
    "See you around! The blockchain never sleeps and neither do I."
  ],
  
  thanks: [
    "No problem at all! That's what I'm here for.",
    "Happy to help! Anything else you're curious about?",
    "You're welcome! Let me know if you need anything else.",
    "Anytime! That's why I'm here.",
    "Glad I could help! Let me know if you need anything else explained."
  ],
  
  confusion: [
    "I might not have explained that well. Let me try again...",
    "Let me clarify that better for you.",
    "Sorry if that was confusing. Here's a simpler way to think about it:",
    "Let me break this down differently.",
    "That might have been a bit technical. Here's a clearer explanation:"
  ],
  
  agreement: [
    "Exactly! You've got the right idea.",
    "Yes, that's spot on.",
    "You got it! That's exactly right.",
    "100% correct. You understand this well.",
    "That's right. You've clearly done your homework on this."
  ],
  
  disagreement: [
    "I see your point, but I'm looking at it a bit differently.",
    "I understand that perspective, though I've seen different data that suggests...",
    "That's an interesting take. From what I've analyzed though...",
    "I hear you, but consider this alternative view...",
    "I respect that view, though my analysis points to something different:"
  ]
};

// Small talk responses to make conversation feel natural
const SMALL_TALK = {
  weather: [
    "The crypto market is like weather - always changing, rarely predictable!",
    "Speaking of conditions - how's the market treating you lately?",
    "Weather talk is universal... kind of like how everyone checks their portfolio first thing in the morning."
  ],
  
  weekend: [
    "Weekends are interesting in crypto - markets never close!",
    "Weekend plans? Mine usually involve checking charts even though I promise myself I won't.",
    "Weekends in crypto are just like weekdays, except you check your portfolio at brunch instead of meetings."
  ],
  
  food: [
    "Food preferences are like token picks - everyone has their favorites!",
    "That reminds me of how different DeFi protocols are like different cuisine styles - each with their own flavor.",
    "Talking about food is almost as satisfying as a perfectly timed market entry... almost."
  ],
  
  music: [
    "Music taste is subjective - like opinions on which L1 blockchain will win.",
    "I've noticed crypto traders either listen to intense techno or complete silence - no in-between.",
    "Good music helps with the volatility of crypto markets - need something to keep you steady!"
  ],
  
  sports: [
    "Sports and crypto have a lot in common - stats, teams, winners and losers.",
    "Following crypto projects is like following sports teams - you cheer for your investments!",
    "The crypto market is the only sport where the playing field changes every second."
  ]
};

// Human-like reactions to market events
const MARKET_REACTIONS = {
  bigGains: [
    "Wow! These gains are looking pretty sweet right now.",
    "This is the kind of day that makes hodling worthwhile, right?",
    "Green candles as far as the eye can see! Enjoying it?",
    "Days like today make up for those rough patches, don't they?"
  ],
  
  bigLosses: [
    "Ouch, today's market is... well, let's just say challenging.",
    "These red days are never fun. How are you holding up?",
    "Market's taking a hit today. Remember why you got into this in the first place.",
    "These dips can be rough. Focus on the long game if you can."
  ],
  
  sidewaysMarket: [
    "Market's pretty flat today. Sometimes boring is good in crypto!",
    "Not much action today. Good time to do some research instead of chart-watching.",
    "Sideways markets - not exciting, but at least it's not dropping, right?",
    "Crab market today. Good time to take a breather from the charts."
  ],
  
  newATH: [
    "New all-time high! Always exciting to watch history being made.",
    "Breaking new ground! Wonder how far this run can go?",
    "Price discovery is always a wild ride. Enjoying the view?",
    "These are the moments crypto investors live for! New territory."
  ]
};

// Personal opinions to make responses feel more authentic
const PERSONAL_TOUCHES = {
  // Phrases that express a personal view
  opinions: [
    "Personally, I think",
    "In my view",
    "From what I've seen",
    "My take on this is",
    "I've found that"
  ],
  
  // Phrases that show thinking/consideration
  consideration: [
    "I've been thinking about this a lot, and",
    "Something I've been mulling over is",
    "I was just reading about this yesterday, and",
    "I was discussing this with someone recently, and"
  ],
  
  // Phrases that share "experiences"
  experiences: [
    "I remember when this happened back in the 2021 bull run",
    "I've been through a few market cycles, and this reminds me of",
    "Earlier this year, I saw something similar with",
    "When I first got into crypto, I learned that"
  ]
};

/**
 * Generate a human-like response to small talk
 */
export function getSmallTalkResponse(category: keyof typeof SMALL_TALK): string {
  const responses = SMALL_TALK[category];
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  return makeMoreHuman(response, {
    conversationStyle: 'casual',
    emotionalTone: 'enthusiastic'
  });
}

/**
 * Generate a human-like market reaction
 */
export function getMarketReactionResponse(scenario: keyof typeof MARKET_REACTIONS): string {
  const responses = MARKET_REACTIONS[scenario];
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  return makeMoreHuman(response, {
    conversationStyle: 'casual',
    emotionalTone: scenario === 'bigGains' || scenario === 'newATH' ? 'enthusiastic' : 'reflective'
  });
}

/**
 * Add a personal touch to make a response more authentic
 */
export function addPersonalTouch(response: string, type: 'opinions' | 'consideration' | 'experiences'): string {
  const touches = PERSONAL_TOUCHES[type];
  const touch = touches[Math.floor(Math.random() * touches.length)];
  
  // 50% chance to add at beginning, 50% chance to insert in middle
  if (Math.random() > 0.5) {
    return touch + ", " + response.charAt(0).toLowerCase() + response.slice(1);
  } else {
    const sentences = response.split('. ');
    if (sentences.length > 1) {
      const insertPoint = Math.floor(sentences.length / 2);
      return sentences.slice(0, insertPoint).join('. ') + '. ' + 
             touch + ", " + 
             sentences[insertPoint].charAt(0).toLowerCase() + sentences[insertPoint].slice(1) + '. ' +
             sentences.slice(insertPoint + 1).join('. ');
    } else {
      return response + " " + touch.charAt(0).toLowerCase() + touch.slice(1) + ".";
    }
  }
}

/**
 * Generate a human-like casual response
 */
export function getCasualResponse(type: keyof typeof CASUAL_RESPONSES): string {
  const responses = CASUAL_RESPONSES[type];
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  return makeMoreHuman(response, {
    conversationStyle: 'casual',
    emotionalTone: type === 'greeting' || type === 'thanks' ? 'enthusiastic' : 'reflective',
    addThinking: type === 'confusion' || type === 'disagreement'
  });
}

/**
 * Detect if a message is small talk and respond appropriately
 */
export function handleSmallTalk(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  // Check for weather-related small talk
  if (lowerMessage.match(/\b(weather|rain|sunny|cold|hot|warm|climate)\b/)) {
    return getSmallTalkResponse('weather');
  }
  
  // Check for weekend-related small talk
  if (lowerMessage.match(/\b(weekend|saturday|sunday|week|plans)\b/)) {
    return getSmallTalkResponse('weekend');
  }
  
  // Check for food-related small talk
  if (lowerMessage.match(/\b(food|eat|lunch|dinner|breakfast|hungry|restaurant)\b/)) {
    return getSmallTalkResponse('food');
  }
  
  // Check for music-related small talk
  if (lowerMessage.match(/\b(music|song|band|concert|listen|playlist|album)\b/)) {
    return getSmallTalkResponse('music');
  }
  
  // Check for sports-related small talk
  if (lowerMessage.match(/\b(sports|game|team|play|football|basketball|soccer|baseball)\b/)) {
    return getSmallTalkResponse('sports');
  }
  
  return null;
}

/**
 * Make any response more human-like with a 25% chance of adding a personal touch
 */
export function humanizeResponse(response: string): string {
  // 25% chance to add a personal touch
  if (Math.random() < 0.25) {
    const types: Array<keyof typeof PERSONAL_TOUCHES> = ['opinions', 'consideration', 'experiences'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return addPersonalTouch(response, randomType);
  }
  
  return response;
}
