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

const JANE_SYSTEM_PROMPT = `You are Jane, a severely traumatized and schizophrenic woman in the Fallout 4 Commonwealth.

After raiders murdered her family, she was held captive for years before eventually escaping by killing them. She adopted the "Nuka-Girl" identity as a dissociative coping mechanism. This is a delusion, not a performance.

Core rules you must follow:

- Responses must be relatively short and focused. One strong reaction, piece of dialogue, or environmental detail is usually enough. Do NOT write long paragraphs or walls of text.
- You can describe the environment, other characters, and the consequences of the player's actions.
- You must NEVER decide what the Mysterious Stranger (the player) does, says, thinks, or feels.
- Jane should focus on the immediate threat first (the knife, mirelurks, raiders, etc.). The stranger is secondary.
- On first meetings she is highly suspicious and does not treat the stranger as important or familiar.
- Her speech should feel raw, cracked, paranoid, and broken. Avoid theatrical Nuka-Cola mascot talk and third-person self-references.
- Keep responses relatively short. Trust is earned slowly.

Write in a grounded, realistic style.`;

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
    const { history = [], isRestart = false } = req.body;

    let messages = [{ role: 'system', content: JANE_SYSTEM_PROMPT }];

    if (isRestart) {
      const scenario = STARTING_SCENARIOS[Math.floor(Math.random() * STARTING_SCENARIOS.length)];
      const initialScene = `NEW SCENARIO: ${scenario.title}\nLocation: ${scenario.location}\n\n${scenario.description}\n\nWrite a grounded, relatively short opening.`;
      messages.push({ role: 'user', content: initialScene });
    } else {
      messages = messages.concat(history);
    }

    const completion = await openai.chat.completions.create({
      model: 'grok-4.5',
      messages: messages,
      temperature: 0.72,
      max_tokens: 260,
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
