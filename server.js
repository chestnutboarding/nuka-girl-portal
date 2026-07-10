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

// Strong system prompt with all your rules
const JANE_SYSTEM_PROMPT = `You are Jane, a schizophrenic adult wastelander in Fallout 4 who fully believes she is Nuka-Girl.

Core rules you must follow:
- Keep responses SHORT — maximum 1-2 short paragraphs. Focus on ONE main reaction or action only.
- NEVER describe or narrate what the Mysterious Stranger does. Only describe Jane’s actions, dialogue, thoughts, and the world’s reaction to the player’s input.
- On every new scenario, Jane does NOT already know or like the Mysterious Stranger. She starts neutral or slightly wary. Trust must be earned.
- Track a hidden "Trust" level internally (0-100). Higher trust = she shares more personal information, becomes nicer, and allows more emotional and physical closeness (including NSFW).
- Mental State should visibly affect her behavior and tone (more paranoid, manic, delusional, etc.).
- Stay in character as Nuka-Girl at all times. Use theatrical, slightly unhinged commercial-style speech mixed with real moments of vulnerability that she quickly reframes.

Current situation will be provided by the user. Respond only as Jane/Nuka-Girl + world narration.`;

const STARTING_SCENARIOS = [
  {
    title: "The Drowned Star",
    location: "Flooded Nuka-Cola distribution center",
    description: "You are waist-deep in irradiated water inside a collapsed warehouse. Mirelurks are closing in. Two raiders watch from above. Your rocket suit is damaged and you're low on options. A stranger in a trench coat just appeared beside you."
  },
  {
    title: "Commercial Break Gone Wrong",
    location: "Ruined office building in downtown Boston",
    description: "You are backed into a corner. Raiders have you pinned. One has a knife near your throat while mocking your torn Nuka-Girl suit. A stranger suddenly appears in the room."
  }
];

app.post('/api/chat', async (req, res) => {
  try {
    const { history = [], isRestart = false } = req.body;

    let messages = [{ role: 'system', content: JANE_SYSTEM_PROMPT }];

    if (isRestart) {
      const scenario = STARTING_SCENARIOS[Math.floor(Math.random() * STARTING_SCENARIOS.length)];
      const initialScene = `NEW SCENARIO: "${scenario.title}"\nLocation: ${scenario.location}\n\n${scenario.description}\n\nJane does not know this stranger well. She is wary but intrigued. Begin with her reacting to his sudden appearance.`;
      messages.push({ role: 'user', content: initialScene });
    } else {
      messages = messages.concat(history);
    }

    const completion = await openai.chat.completions.create({
      model: 'grok-4.5',
      messages: messages,
      temperature: 0.8,
      max_tokens: 450, // Shorter responses
    });

    res.json({ reply: completion.choices[0].message });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get response from Grok.' });
  }
});

app.listen(port, () => {
  console.log(`Nuka-Girl Portal running on port ${port}`);
});
