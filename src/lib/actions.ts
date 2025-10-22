'use server';

import { add, set } from 'date-fns';
import { z } from 'zod';
import { suggestOptimalMeetingTimes, type SuggestOptimalMeetingTimesInput, type SuggestOptimalMeetingTimesOutput } from '@/ai/flows/suggest-optimal-meeting-times';

import type { BookingDetails, BookingResponse, BusySlot } from './types';

// Mock function to get busy times for a host
// In a real app, this would fetch from a calendar API
export async function getAvailability(date: Date): Promise<BusySlot[]> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();

  const busySlots: BusySlot[] = [];

  // Static block for lunch
  busySlots.push({
    start: set(date, { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }),
    end: set(date, { hours: 13, minutes: 0, seconds: 0, milliseconds: 0 }),
  });

  // Add some pseudo-random busy slots based on the day
  if (dayOfWeek % 2 === 0) { // Even days of the week
    busySlots.push({
      start: set(date, { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 }),
      end: set(date, { hours: 11, minutes: 30, seconds: 0, milliseconds: 0 }),
    });
  }

  if (dayOfMonth % 3 === 0) {
    busySlots.push({
      start: set(date, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 }),
      end: set(date, { hours: 16, minutes: 0, seconds: 0, milliseconds: 0 }),
    });
  }
  
  if (dayOfMonth % 5 === 0) {
    busySlots.push({
      start: set(date, { hours: 17, minutes: 30, seconds: 0, milliseconds: 0 }),
      end: set(date, { hours: 18, minutes: 0, seconds: 0, milliseconds: 0 }),
    });
  }

  return busySlots;
}

// Mock function to book a meeting
// In a real app, this would call Google Calendar API and a booking management API
export async function bookMeeting(data: BookingDetails): Promise<BookingResponse> {
  const schema = z.object({
    name: z.string().min(2, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    time: z.date(),
    meetingType: z.enum(['30', '60']),
    notes: z.string().optional(),
  });

  const validated = schema.safeParse(data);
  if (!validated.success) {
    return { success: false, message: 'Datos inválidos.' };
  }

  console.log('Booking meeting with details:', data);
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call delay

  // Mock success/failure
  if (data.name.toLowerCase() === 'error') {
    return { success: false, message: 'Error simulado al crear la reunión.' };
  }

  return {
    success: true,
    message: '¡Reunión agendada con éxito!',
    meetingLink: `https://meet.google.com/mock-${Math.random().toString(36).substring(2, 9)}`,
    bookingDetails: {
      name: data.name,
      time: data.time,
    },
  };
}


export async function getSmartSuggestions(input: SuggestOptimalMeetingTimesInput): Promise<SuggestOptimalMeetingTimesOutput> {
    try {
        const suggestions = await suggestOptimalMeetingTimes(input);
        return suggestions;
    } catch (error) {
        console.error("Error fetching smart suggestions:", error);
        return [];
    }
}
