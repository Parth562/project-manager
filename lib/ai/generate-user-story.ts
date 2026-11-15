import { aiGeneratedStorySchema } from "@/lib/validations/user-story";

export interface GeneratedStory {
  storyText: string;
  acceptanceCriteria: string[];
  isAiGenerated: boolean;
}

// Fallback template used when no GEMINI_API_KEY is set or the API call fails.
function fallbackGenerate(title: string, _description: string): GeneratedStory {
  const storyText = `As a user, I want to ${title.toLowerCase()}, so that I can achieve the goals described in the requirement.`;
  const acceptanceCriteria = [
    `The system should allow the user to perform: ${title}.`,
    `The system should validate inputs before processing.`,
    `The system should display a success message upon completion.`,
    `The system should handle errors gracefully and display appropriate messages.`,
    `The system should log the action for audit purposes.`,
  ];
  return { storyText, acceptanceCriteria, isAiGenerated: false };
}

export async function generateUserStory(
  title: string,
  _description: string,
): Promise<GeneratedStory> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return fallbackGenerate(title, _description);
  }

  const prompt = `You are a software requirements analyst. Given the following software requirement, generate:
1. A user story in the format: "As a [user], I want [feature], so that [benefit]."
2. Exactly 4 clear and testable acceptance criteria, each describing an expected system behavior.

Requirement Title: ${title}
Requirement Description: ${_description}

Respond ONLY with a valid JSON object in this exact format, no markdown, no extra text:
{
  "storyText": "As a [user], I want [feature], so that [benefit].",
  "acceptanceCriteria": [
    "Criterion 1",
    "Criterion 2",
    "Criterion 3",
    "Criterion 4"
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return fallbackGenerate(title, _description);
    }

    const data = await response.json();
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip possible markdown code fences
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    const parsed = JSON.parse(jsonText);
    const validated = aiGeneratedStorySchema.safeParse(parsed);

    if (!validated.success) {
      console.error("AI response failed validation:", validated.error);
      return fallbackGenerate(title, _description);
    }

    return {
      storyText: validated.data.storyText,
      acceptanceCriteria: validated.data.acceptanceCriteria,
      isAiGenerated: true,
    };
  } catch (err) {
    console.error("generateUserStory error:", err);
    return fallbackGenerate(title, _description);
  }
}
