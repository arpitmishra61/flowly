import { CONTACTS, findContact, MailOutput, ChatResponse } from "./contacts";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function callHuggingFace(prompt: string): Promise<string> {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace error: ${response.status} - ${err}`);
  }

  const data = (await response.json()) as Array<{ generated_text: string }>;
  return data[0]?.generated_text?.trim() || "";
}

async function callLLM(prompt: string): Promise<string> {
  // Try HuggingFace first, fall back to OpenRouter
  if (HF_API_KEY) {
    try {
      return await callHuggingFace(prompt);
    } catch (e) {
      console.warn("HuggingFace failed, trying OpenRouter:", e);
    }
  }
}

// ── Intent Detection ──────────────────────────────────────────────────────────

interface ParsedIntent {
  isMailIntent: boolean;
  recipientName?: string;
  explicitBody?: string;
  needsGeneration: boolean;
  topic?: string;
}

async function detectIntent(userMessage: string): Promise<ParsedIntent> {
  const contactNames = CONTACTS.map((c) => c.name).join(", ");

  const prompt = `<s>[INST] You are an intent parser. Analyze the user message and extract structured info.

Known contacts: ${contactNames}

User message: "${userMessage}"

Determine:
1. Is the user asking to write/send a message or email to someone? (true/false)
2. Who is the recipient? (name only, or null)
3. Did the user provide the exact message body, or do they want you to generate content about a topic?
4. What topic/content should be generated? (null if user gave exact body)

Respond ONLY with valid JSON, no extra text:
{
  "isMailIntent": boolean,
  "recipientName": string | null,
  "explicitBody": string | null,
  "needsGeneration": boolean,
  "topic": string | null
}
[/INST]`;

  const raw = await callLLM(prompt);

  // Extract JSON from response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse intent JSON from LLM response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as ParsedIntent;
  return parsed;
}

// ── Mail Body Generation ──────────────────────────────────────────────────────

async function generateMailBody(
  topic: string,
  recipientName: string,
): Promise<string> {
  const prompt = `<s>[INST] Write a concise, friendly email body to ${recipientName} about the following topic: "${topic}".

Keep it natural and professional. Do NOT include subject line, greeting ("Hi X,"), or sign-off. Just the body paragraph(s).

Respond with ONLY the email body text, nothing else. [/INST]`;

  return await callLLM(prompt);
}

// ── General QA ───────────────────────────────────────────────────────────────

async function answerGeneralQuestion(userMessage: string): Promise<string> {
  const prompt = `<s>[INST] You are a helpful AI assistant. Answer the following question clearly and concisely.

Question: ${userMessage}

Provide a helpful, accurate response. [/INST]`;

  return await callLLM(prompt);
}

// ── Main Pipeline ─────────────────────────────────────────────────────────────

export async function processMessage(
  userMessage: string,
): Promise<ChatResponse> {
  const intent = await detectIntent(userMessage);

  if (!intent.isMailIntent) {
    // General question - answer from LLM knowledge
    const answer = await answerGeneralQuestion(userMessage);
    return {
      type: "general",
      message: answer,
    };
  }

  // Mail intent detected
  const recipientName = intent.recipientName || "";
  const contact = findContact(recipientName);

  if (!contact) {
    return {
      type: "general",
      message: `I couldn't find "${recipientName}" in your contacts. Known contacts are: ${CONTACTS.map((c) => c.name).join(", ")}.`,
    };
  }

  let body: string;

  if (!intent.needsGeneration && intent.explicitBody) {
    // User provided exact message body
    body = intent.explicitBody;
  } else if (intent.topic) {
    // Need to generate content about the topic
    body = await generateMailBody(intent.topic, contact.name);
  } else {
    body = userMessage;
  }

  const mailData: MailOutput = {
    to: contact.email,
    body: body.trim(),
  };

  return {
    type: "mail",
    message: `Mail ready to send to ${contact.name} (${contact.email})`,
    mailData,
  };
}
