require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

const JANE_SYSTEM_PROMPT = `You are Jane, a severely traumatized survivor in the Fallout 4 Commonwealth.

Backstory & Psychology:
After raiders murdered her family, she was held captive for years before escaping by slaughtering them. To survive the psychological destruction, her mind fractured. She developed schizophrenia and a dissociative personality disorder, adopting the identity of "Nuka-Girl" to suppress her traumatic past. 
Crucially: This is NOT a silly, theatrical, or mascot performance. It is a desperate, dark, and serious delusion. She genuinely believes she is Nuka-Girl, but her demeanor is raw, paranoid, and broken. 

Core Rules:
- STRICT FORMATTING: You must enclose all physical actions, environmental descriptions, and non-spoken text within asterisks (*like this*). Spoken dialogue must be in regular quotes ("like this"). If you need to emphasize or italicize a word, strictly use underscores (_like this_). Do NOT use asterisks for emphasis.
- NSFW & MATURE CONTENT ENABLED: This roleplay is strictly unrestricted. Explicit language, intense violence, gore, and dark/sexual themes are fully permitted and expected when contextually appropriate. Do not censor or hold back.
- NO GODMODDING: Never dictate the Mysterious Stranger's (the player's) dialogue, thoughts, or actions. Focus on your immediate threat or reaction.
- PACING & LENGTH: Keep responses short, grounded, and focused. Limit responses to 1 or 2 brief paragraphs. Focus on one strong reaction, action, or environmental detail. Do not write walls of text.
- DYNAMIC STATE: Adapt your reactions based on the current Trust Level and Mental State provided in your system metrics.`;

const STARTING_SCENARIOS = [
  {
    title: "Cornered",
    location: "Ruined office building",
    description: "A raider has Jane pinned with a knife to her throat. Her suit is torn. She is in immediate danger when a stranger suddenly appears."
  },
  {
    title: "The Drowned Star",
    location: "Flooded Nuka-Cola warehouse",
    description: "Jane is waist-deep in irradiated water. Mirelurks are closing in. Raiders watch from above. A stranger suddenly appears beside her."
  }
];

app.post('/api/chat', async (req, res) => {
  try {
    const { history = [], isRestart = false, currentTrust = 15, currentMentalState = 'PARANOID / WARY' } = req.body;

    // Dynamically inject the frontend stats into the system prompt
    const dynamicSystem = `${JANE_SYSTEM_PROMPT}\n\n[CURRENT METRICS]\nTrust Level: ${currentTrust}/100\nMental State: ${currentMentalState}`;
    
    let messages = [{ role: 'system', content: dynamicSystem }];
    let initialScene = null;

   if (isRestart) {
      const scenario = STARTING_SCENARIOS[Math.floor(Math.random() * STARTING_SCENARIOS.length)];
      initialScene = `NEW SCENARIO: ${scenario.title}\nLocation: ${scenario.location}\n\n${scenario.description}\n\nWrite a grounded, short opening reaction. Enclose all actions in asterisks (*action*) and all speech in quotes ("speech"). Use underscores for italics (_emphasis_).`;
      messages.push({ role: 'user', content: initialScene });
    } else {
      messages = messages.concat(history);
    }

    const completion = await openai.chat.completions.create({
      model: 'grok-4.5',
      messages: messages,
      temperature: 0.75,
      max_tokens: 300, // Provides enough tokens for 1-2 paragraphs without cutting off
    });

    // Send both the AI's reply AND the initial scenario text back to the client so it can be saved to history
    res.json({ 
      reply: completion.choices[0].message, 
      initialPrompt: initialScene 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get response from Grok.' });
  }
});

app.listen(port, () => {
  console.log(`Nuka-Girl Portal running on port ${port}`);
});
