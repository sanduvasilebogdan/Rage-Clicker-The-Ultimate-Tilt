
const FALLBACK_INSULTS = [
  "Nice miss, slow-poke.",
  "My grandma clicks faster than that.",
  "Are you even trying?",
  "The button is right there. Mostly.",
  "Maybe try a different game? Like solitaire?",
  "Error 404: Skill not found.",
  "I've seen bots with better aim.",
  "Is your mouse broken or just your spirit?",
  "That was embarrassing to watch.",
  "You're making the button laugh.",
  "Click harder, maybe that'll help. (It won't).",
  "Is that your best? Really?"
];

const PRAISE_MESSAGES = [
  "Lucky shot.",
  "Finally.",
  "Even a blind squirrel finds a nut.",
  "Don't get cocky.",
  "Pure fluke.",
  "About time.",
  "Stop hacking."
];

export const generateTrashTalk = async (
  event: string,
  _score: number,
  _level: number,
  _combo: number
): Promise<string> => {
  // Simulating a slight delay to maintain UI feel, but purely local
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const list = event.includes('miss') ? FALLBACK_INSULTS : PRAISE_MESSAGES;
  return list[Math.floor(Math.random() * list.length)];
};
