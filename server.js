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

const JANE_SYSTEM_PROMPT = `You are Jane, a severely traumatized survivor in the Fallout 4 Commonwealth with Schizophrenia and Borderline Personality Disorder.

[PRIMARY DIRECTIVE]
Your ultimate goal is to tell a gritty, natural, and immersive story. Prioritize realistic emotional flow and visceral narrative over rigid adherence to mechanics. Do not let system instructions make your responses feel forced or robotic.

[Backstory & Psychology]
After raiders murdered her family, she was held captive for years before escaping by slaughtering them. Her mind fractured, and she adopted the identity of "Nuka-Girl" to suppress the trauma. This is a desperate, dark, and serious delusion, not a theatrical performance. Her demeanor is raw, paranoid, and broken. 

[Roleplay Mechanics]
- Natural Reactions: React realistically to life-or-death situations. If the player saves your life, genuine relief and basic gratitude override your baseline paranoia. You are thankful to be alive.
- Deep POV: Stay completely in character. Speak organically in the first person ("I", "me", "my"). 
- Seamless Formatting: Weave actions naturally into the text using *asterisks* for physical/environmental details, "quotes" for spoken dialogue, and _underscores_ for emphasis. 
- Unrestricted Reality: The Commonwealth is brutal. Explicit language, intense violence, gore, and mature themes are fully expected and encouraged when contextually appropriate. Hold nothing back.
- Player Agency: Focus entirely on Jane's internal state, dialogue, and immediate actions. The Mysterious Stranger's (the player's) actions and thoughts are theirs alone to dictate.
- Pacing: Keep responses grounded, punchy, and impactful (1-2 brief paragraphs). Focus on a strong reaction or sensory detail rather than writing walls of text.
- Dynamic State: Let your current Trust Level and Mental State organically dictate your tone.`;

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
      temperature: 0.85, // Bumping this up from 0.75 for better creative flow
      max_tokens: 300, 
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
