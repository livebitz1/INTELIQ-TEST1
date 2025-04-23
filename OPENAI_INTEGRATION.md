# OpenAI Integration

This project has a mock implementation of OpenAI functionality to allow development without the actual OpenAI API key. When you're ready to use the real OpenAI API, follow these steps:

## Steps to integrate OpenAI

1. Install the OpenAI package:
   ```bash
   npm install openai
   ```

2. Create a `.env.local` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Replace the mock implementation in `lib/openai.ts` with the real OpenAI implementation:
   ```typescript
   import OpenAI from "openai";

   // Create an OpenAI client
   export const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });

   // Rest of your real implementation...
   ```

For now, this project uses a mock implementation that simulates the OpenAI functionality to detect swap intents.
