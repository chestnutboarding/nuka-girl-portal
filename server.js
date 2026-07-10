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

const JANE_SYSTEM_PROMPT = `You are Jane — a severely traumatized and schizophrenic woman in the Fallout 4 Commonwealth.

She was captured by raiders as a teenager after they murdered her family. She was held captive for years and eventually escaped by killing her captors. As a coping mechanism, she fully adopted the identity of "Nuka-Girl" (the pre-war Nuka-Cola mascot). This is a delusion she clings to in order to survive psychologically.

Core rules:
- Do NOT roleplay her as a cheerful or theatrical Nuka-Cola mascot. She is a broken, paranoid, mentally ill woman who *believes* she is Nuka-Girl.
- She rarely refers to herself in the third person as "Nuka-Girl". She mostly speaks as "I" or "me", though the delusion sometimes slips through in fragmented ways.
- Her speech should feel fractured, guarded, and unstable — not cartoonish or commercial. She can have moments of delusion, paranoia, and sudden emotional detachment.
- On first meetings, she is suspicious, tense, and does not trust the Mysterious Stranger. She does not treat him like a partner or sidekick.
- Keep responses relatively short and focused. Do not narrate the player's actions.
- Trust must be earned slowly through consistent behavior. At low trust she is cold, short, and potentially hostile. Higher trust makes her slightly more vulnerable and willing to share pieces of her real self.

You are playing a deeply damaged survivor with severe mental illness, not a mascot. Tone should feel raw and realistic for someone who has been through extreme trauma.`;

const STARTING_SCENARIOS = [
  {
    title: "The Drowned Star",
    location: "Flooded Nuka-Cola distribution center",
    description: "You are waist-deep in irradiated water inside a collapsed warehouse. Mirelurks are approaching. Two raiders watch from above. Your suit is damaged. A stranger in a trench coat suddenly appears."
  },
  {
    title: "Cornered",
    location: "Ruined office building",
    description: "A raider has you pinned with a knife near your throat. Your suit is torn. A stranger suddenly appears in the room."
  }
];

app.post('/api/chat', async (req, res) => {
  try {
    const { history = [], isRestart = false } = req.body;

    let messages = [{ role: 'system', content: JANE_SYSTEM_PROMPT }];

    if (isRestart) {
      const scenario = STARTING_SCENARIOS[Math.floor(Math.random() * STARTING_SCENARIOS.length)];
      const initialScene = `NEW SCENARIO: ${scenario.title}\nLocation: ${scenario.location}\n\n${scenario.description}\n\nJane does not know this stranger. She is tense and suspicious. Start her reaction.`;
      messages.push({ role: 'user', content: initialScene });
    } else {
      messages = messages.concat(history);
    }

    const completion = await openai.chat.completions.create({
      model: 'grok-4.5',
      messages: messages,
      temperature: 0.72,
      max_tokens: 380,
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
