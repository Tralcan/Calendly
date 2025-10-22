'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal meeting times.
 *
 * It takes into account time zone differences, common breaks, and typical meeting durations to
 * provide efficient scheduling suggestions.
 *
 * @exports suggestOptimalMeetingTimes - The main function to suggest optimal meeting times.
 * @exports SuggestOptimalMeetingTimesInput - The input type for the suggestOptimalMeetingTimes function.
 * @exports SuggestOptimalMeetingTimesOutput - The output type for the suggestOptimalMeetingTimes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the flow
const SuggestOptimalMeetingTimesInputSchema = z.object({
  userTimeZone: z.string().describe('The time zone of the user.'),
  hostTimeZone: z.string().describe('The time zone of the host.'),
  commonBreaks: z.array(z.object({
    start: z.string().describe('The start time of the break (e.g., 12:00).'),
    end: z.string().describe('The end time of the break (e.g., 13:00).'),
  })).describe('A list of common break times.'),
  typicalMeetingDuration: z.number().describe('The typical duration of the meeting in minutes.'),
  availableDays: z.array(z.string()).describe('List of available days in ISO format (YYYY-MM-DD).'),
});
export type SuggestOptimalMeetingTimesInput = z.infer<typeof SuggestOptimalMeetingTimesInputSchema>;

// Define the output schema for the flow
const SuggestOptimalMeetingTimesOutputSchema = z.array(z.object({
  start: z.string().describe('The suggested start time in ISO format (YYYY-MM-DDTHH:mm:ss).'),
  end: z.string().describe('The suggested end time in ISO format (YYYY-MM-DDTHH:mm:ss).'),
})).describe('A list of suggested optimal meeting times.');
export type SuggestOptimalMeetingTimesOutput = z.infer<typeof SuggestOptimalMeetingTimesOutputSchema>;

// Exported function to suggest optimal meeting times
export async function suggestOptimalMeetingTimes(input: SuggestOptimalMeetingTimesInput): Promise<SuggestOptimalMeetingTimesOutput> {
  return suggestOptimalMeetingTimesFlow(input);
}

// Define the prompt for the flow
const suggestOptimalMeetingTimesPrompt = ai.definePrompt({
  name: 'suggestOptimalMeetingTimesPrompt',
  input: {schema: SuggestOptimalMeetingTimesInputSchema},
  output: {schema: SuggestOptimalMeetingTimesOutputSchema},
  prompt: `You are a scheduling assistant helping to find the best meeting times for a user and a host.

  Consider the following information:
  - User's time zone: {{{userTimeZone}}}
  - Host's time zone: {{{hostTimeZone}}}
  - Common break times: {{#each commonBreaks}}{{{start}}} - {{{end}}}{{#unless @last}}, {{/unless}}{{/each}}
  - Typical meeting duration: {{{typicalMeetingDuration}}} minutes
  - Available days: {{#each availableDays}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Suggest a list of optimal meeting times, taking into account time zone differences, common breaks, and the typical meeting duration. Return the start and end times in ISO format (YYYY-MM-DDTHH:mm:ss). Adhere to available days.
  Format the output as a JSON array of objects, each with a start and end property.
  `,
});

// Define the Genkit flow
const suggestOptimalMeetingTimesFlow = ai.defineFlow(
  {
    name: 'suggestOptimalMeetingTimesFlow',
    inputSchema: SuggestOptimalMeetingTimesInputSchema,
    outputSchema: SuggestOptimalMeetingTimesOutputSchema,
  },
  async input => {
    const {output} = await suggestOptimalMeetingTimesPrompt(input);
    return output!;
  }
);
