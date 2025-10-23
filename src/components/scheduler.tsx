"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, set, startOfToday, eachMinuteOfInterval, isBefore, isAfter, areIntervalsOverlapping, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { getAvailability, bookMeeting } from "@/lib/actions";
import type { BusySlot, BookingResponse } from "@/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BookingConfirmation from "./booking-confirmation";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { ArrowLeft, Clock, Calendar as CalendarIcon } from "lucide-react";
import SmartSuggestions from "./smart-suggestions";

const bookingSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
  email: z.string().email("Por favor, introduce un email válido."),
  notes: z.string().optional(),
});

type Step = "date" | "time" | "form" | "confirmed";

export default function Scheduler() {
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<Date | undefined>();
  const [meetingType, setMeetingType] = useState<"30" | "60">("30");
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<BookingResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [debugBusySlots, setDebugBusySlots] = useState<BusySlot[] | null>(null);
  const { toast } = useToast();
  const today = startOfToday();

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { name: "", lastName: "", email: "", notes: "" },
  });

  const generateTimeSlots = (date: Date, busySlots: BusySlot[], duration: number): Date[] => {
    const startOfDay = set(date, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    const endOfDay = set(date, { hours: 18, minutes: 0, seconds: 0, milliseconds: 0 });
    const now = new Date();
  
    const allSlots = eachMinuteOfInterval(
      { start: startOfDay, end: endOfDay },
      { step: 30 }
    );
  
    const todaysBusySlots = busySlots.filter(slot => isSameDay(new Date(slot.start), date));
  
    return allSlots.filter((slotStart) => {
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
      if (isBefore(slotStart, now) || isAfter(slotEnd, endOfDay)) return false;
  
      return !todaysBusySlots.some((busySlot) =>
        areIntervalsOverlapping(
          { start: slotStart, end: slotEnd },
          { start: new Date(busySlot.start), end: new Date(busySlot.end) },
          { inclusive: false }
        )
      );
    });
  };

  useEffect(() => {
    if (selectedDate) {
      setIsLoadingSlots(true);
      setDebugBusySlots(null);
      getAvailability(selectedDate)
        .then((busySlots) => {
          setDebugBusySlots(busySlots);
          const slots = generateTimeSlots(selectedDate, busySlots, parseInt(meetingType));
          setAvailableSlots(slots);
        })
        .finally(() => setIsLoadingSlots(false));
    }
  }, [selectedDate, meetingType]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setStep("time");
    }
  };

  const handleSmartSuggestionSelect = (suggestion: Date) => {
    handleDateSelect(suggestion);
    setTimeout(() => handleTimeSelect(suggestion), 100); 
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    setStep("form");
  };

  const onSubmit = (data: z.infer<typeof bookingSchema>) => {
    if (!selectedTime) return;
    startTransition(async () => {
      const response = await bookMeeting({ ...data, time: selectedTime, meetingType });
      if (response.success) {
        setBookingResponse(response);
        setStep("confirmed");
      } else {
        toast({
          variant: "destructive",
          title: "Error en la reserva",
          description: response.message,
        });
      }
    });
  };

  const handleReset = () => {
    setStep("date");
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setBookingResponse(null);
    form.reset();
  };

  const RightPanelContent = () => {
    if (step === "confirmed" && bookingResponse?.bookingDetails) {
      return <BookingConfirmation bookingDetails={bookingResponse.bookingDetails} meetingLink={bookingResponse.meetingLink!} onReset={handleReset} />;
    }

    if (step === 'date' || !selectedDate) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
            <CalendarIcon className="w-16 h-16 mb-4" />
            <p className="font-semibold text-lg">Selecciona una fecha</p>
            <p className="text-sm">Elige un día en el calendario para ver los horarios disponibles.</p>
        </div>
      );
    }

    if (isLoadingSlots) {
      return (
        <div>
          <h2 className="font-headline font-semibold text-xl mb-4 text-center">Buscando horarios...</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </div>
      );
    }
    
    if (step === 'time' && availableSlots.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
            <Clock className="w-16 h-16 mb-4" />
            <p className="font-semibold text-lg">No hay horarios disponibles</p>
            <p className="text-sm">Por favor, selecciona otra fecha.</p>
        </div>
      );
    }
    
    if (step === 'time' && availableSlots.length > 0) {
      return (
        <div>
          <h2 className="font-headline font-semibold text-xl mb-4">Elige un horario</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {availableSlots.map((slot) => (
              <Button key={slot.toISOString()} variant="outline" onClick={() => handleTimeSelect(slot)} className="bg-accent/10 hover:bg-accent hover:text-accent-foreground border-accent/30 text-accent-foreground">
                {format(slot, "HH:mm")}
              </Button>
            ))}
          </div>
        </div>
      );
    }
    
    if (step === 'form' && selectedTime) {
      return (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setStep('time')} className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h2 className="font-headline font-semibold text-xl mb-2">Confirmar Reserva</h2>
          <p className="text-muted-foreground mb-6">
            Estás reservando para el {format(selectedTime, "eeee, d 'de' MMMM 'a las' HH:mm", { locale: es })}.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input placeholder="Tu apellido" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notas (opcional)</FormLabel><FormControl><Textarea placeholder="Algo que el anfitrión deba saber..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={isPending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {isPending ? "Agendando..." : "Confirmar y agendar"}
              </Button>
            </form>
          </Form>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="bg-muted/30 border-b">
         <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-2xl">Agendar una reunión</CardTitle>
            <SmartSuggestions onSuggestionSelect={handleSmartSuggestionSelect} />
         </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6 p-4 md:p-6">
        <div className="space-y-6">
          <div>
            <h2 className="font-headline font-semibold text-xl mb-4">1. Selecciona el tipo y fecha</h2>
             <RadioGroup defaultValue="30" onValueChange={(value: "30" | "60") => setMeetingType(value)} className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="30" id="r1" /><Label htmlFor="r1">Reunión Corta</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="60" id="r2" /><Label htmlFor="r2">Reunión de Trabajo</Label></div>
            </RadioGroup>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => isBefore(date, today)}
                locale={es}
                className="p-3"
              />
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-4 md:p-6 min-h-[300px] flex flex-col justify-center bg-card">
           <RightPanelContent />
        </div>
      </CardContent>
      {debugBusySlots && (
        <div className="bg-muted p-4 border-t">
          <h3 className="font-semibold text-sm">Respuesta de la API (Depuración):</h3>
          <pre className="text-xs bg-gray-800 text-white p-2 rounded-md mt-2 overflow-auto max-h-40">
            {JSON.stringify(debugBusySlots, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}

    