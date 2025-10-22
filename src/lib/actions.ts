'use server';

import { add, set, startOfDay, endOfDay } from 'date-fns';
import { z } from 'zod';
import { suggestOptimalMeetingTimes, type SuggestOptimalMeetingTimesInput, type SuggestOptimalMeetingTimesOutput } from '@/ai/flows/suggest-optimal-meeting-times';

import type { BookingDetails, BookingResponse, BusySlot } from './types';

// Function to get busy times for a host from the actual API
export async function getAvailability(date: Date): Promise<BusySlot[]> {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  const url = new URL('https://n8n-x1g4.onrender.com/webhook/calendar-disponibilidad');
  url.searchParams.append('start', startDate.toISOString());
  url.searchParams.append('end', endDate.toISOString());

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('Error fetching availability:', response.statusText);
      return [];
    }
    const busySlotsData = await response.json();
    
    // The API seems to return slots as {inicio, fin}. We need to convert string dates to Date objects.
    if (Array.isArray(busySlotsData)) {
      return busySlotsData.map(slot => ({
        start: new Date(slot.inicio),
        end: new Date(slot.fin),
      }));
    }
    
    return [];

  } catch (error) {
    console.error('Failed to fetch availability:', error);
    return [];
  }
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
