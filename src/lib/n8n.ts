/**
 * n8n API Service
 * Handles sending project requirements to n8n webhook
 */

const N8N_WEBHOOK_URL = "https://amrokasha.app.n8n.cloud/webhook/36c6d38a-a962-4022-9bb2-b89f9ff45d2d";

export type RequirementPayload = {
  team_size: number;
  skills: string[];
  budget: number;
  priority: string;
};

/**
 * Send project requirements to n8n webhook
 * @param payload - The project requirements data
 * @returns Promise with the JSON response from n8n
 * @throws Error if the request fails
 */
export async function sendRequirementsToN8n(payload: RequirementPayload): Promise<unknown> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[n8n Service] Failed to send requirements:", error);
    throw error;
  }
}
