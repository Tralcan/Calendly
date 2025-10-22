'use server';

import { add, format, startOfDay, endOfDay } from 'date-fns';
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

// Function to book a meeting using the provided API endpoint
export async function bookMeeting(data: BookingDetails & { lastName: string }): Promise<BookingResponse> {
  const schema = z.object({
    name: z.string().min(2, 'El nombre es requerido'),
    lastName: z.string().min(2, 'El apellido es requerido'),
    email: z.string().email('Email inválido'),
    time: z.date(),
    meetingType: z.enum(['30', '60']),
    notes: z.string().optional(),
  });

  const validated = schema.safeParse(data);
  if (!validated.success) {
    return { success: false, message: 'Datos inválidos.' };
  }

  const { name, lastName, email, time, meetingType } = validated.data;
  const duration = parseInt(meetingType);
  const endTime = add(time, { minutes: duration });
  
  const payload = {
    nombre: name,
    apellido: lastName,
    Tipo: "Reunión trabajo",
    duracion: duration,
    inicio: format(time, "yyyy-MM-dd HH:mm"),
    final: format(endTime, "yyyy-MM-dd HH:mm"),
    email: email,
  };

  try {
    const response = await fetch('https://n8n-x1g4.onrender.com/webhook/565ef0e0-1768-42b8-8dde-543dba0f0879', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error Response:', errorBody);
      return { success: false, message: `Error del servidor: ${response.statusText}` };
    }

    // Assuming the API returns a success message and potentially a meeting link.
    // We will create a mock one for now if not provided.
    const responseData = await response.json();

    return {
      success: true,
      message: '¡Reunión agendada con éxito!',
      meetingLink: responseData.meetingLink || `https://meet.google.com/mock-${Math.random().toString(36).substring(2, 9)}`,
      bookingDetails: {
        name: data.name,
        time: data.time,
      },
    };

  } catch(error) {
    console.error('Failed to book meeting:', error);
    return { success: false, message: 'No se pudo agendar la reunión.' };
  }
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
