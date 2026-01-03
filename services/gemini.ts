import { GoogleGenAI, Type } from "@google/genai";
import { CampusEvent } from "../types";

// We target the internal Discovery API because heellife.unc.edu is a Single Page Application (SPA).
// Fetching the HTML directly only returns an empty shell (<div id="root">), so we must hit the data layer.
const API_BASE_URL = "https://heellife.unc.edu/api/discovery/event/search";

export const findFreeFoodEvents = async (apiKey: string): Promise<CampusEvent[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  // 1. Construct the API URL to fetch events starting from now
  const now = new Date();
  const isoStart = now.toISOString();
  
  // These parameters mimic the search behavior on the website
  const queryParams = new URLSearchParams({
    startsAfter: isoStart,
    orderByField: "startsOn",
    orderByDirection: "ascending",
    status: "Approved",
    take: "50", // Fetch up to 50 events to analyze
    query: "Free Food" // Text search for "Free Food" to approximate the perks filter
  });

  const targetUrl = `${API_BASE_URL}?${queryParams.toString()}`;

  // 2. Fetch the JSON data via Proxy
  const proxies = [
    // Primary: corsproxy.io
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    // Secondary: allorigins.win
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];

  let rawData = "";
  let lastError = null;

  for (const buildProxyUrl of proxies) {
    try {
      const proxyUrl = buildProxyUrl(targetUrl);
      console.log(`Attempting API fetch via: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const text = await response.text();
        // Validation: API should return JSON
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          rawData = text;
          break; 
        }
      }
    } catch (error) {
      console.warn("Proxy API fetch error:", error);
      lastError = error;
    }
  }

  if (!rawData) {
    throw new Error("Failed to retrieve event data. The site API might be unreachable via proxy.");
  }

  // 3. Use Gemini to parse/normalize and filter the raw JSON data
  const ai = new GoogleGenAI({ apiKey });
  
  // Date context for Gemini
  const nextWeekDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
    timeZone: 'America/New_York', 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const todayStr = formatDate(now);
  const nextWeekStr = formatDate(nextWeekDate);

  const PROMPT = `
  Context: Today is ${todayStr} (US Eastern Time).
  Target Time Frame: The coming week (from now until ${nextWeekStr}).
  
  Task: Analyze the provided JSON data from the HeelLife Event API and extract events that offer "Free Food".
  
  Instructions:
  1. The INPUT is a JSON response containing a list of events.
  2. Parse the JSON and extract the following for each relevant event:
     - Title
     - Location (Venue name or address)
     - Description (Summarize if too long)
     - Start Time (ISO string)
     - End Time (ISO string)
     - Source URL (Combine "https://heellife.unc.edu/event/" + the event ID)
  3. FILTERING RULES:
     - STRICTLY include only events between ${todayStr} and ${nextWeekStr}.
     - The event MUST match the "Free Food" intent (e.g., mentions food, pizza, snacks, lunch, dinner, or has "Free Food" perk).
  4. Return a clean JSON array of event objects.
  
  INPUT JSON DATA:
  ${rawData.substring(0, 900000)} 
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: PROMPT,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              location: { type: Type.STRING },
              description: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              sourceUrl: { type: Type.STRING }
            },
            required: ["title", "startDate", "endDate"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const parsedEvents = JSON.parse(jsonText);
    
    return parsedEvents.map((evt: any) => ({
      id: crypto.randomUUID(),
      title: evt.title || "Untitled Event",
      location: evt.location || "TBD",
      description: evt.description || "Free food event found via HeelLife API.",
      startDate: evt.startDate,
      endDate: evt.endDate,
      sourceUrl: evt.sourceUrl || "https://heellife.unc.edu/events",
      foundAt: new Date().toISOString()
    }));

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};