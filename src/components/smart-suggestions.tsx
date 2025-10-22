"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSmartSuggestions } from "@/lib/actions";
import type { SuggestOptimalMeetingTimesOutput } from "@/ai/flows/suggest-optimal-meeting-times";
import { useToast } from "@/hooks/use-toast";

const suggestionSchema = z.object({
  userTimeZone: z.string().min(1, "Requerido"),
  hostTimeZone: z.string().min(1, "Requerido"),
  meetingDuration: z.coerce.number().min(15, "Mínimo 15 minutos"),
});

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
];

type SmartSuggestionsProps = {
  onSuggestionSelect: (suggestion: Date) => void;
};

export default function SmartSuggestions({ onSuggestionSelect }: SmartSuggestionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestOptimalMeetingTimesOutput>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof suggestionSchema>>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      userTimeZone: "America/New_York",
      hostTimeZone: "Europe/London",
      meetingDuration: 30,
    },
  });

  const onSubmit = (data: z.infer<typeof suggestionSchema>) => {
    setSuggestions([]);
    startTransition(async () => {
      const today = new Date();
      const availableDays = [
        format(addDays(today, 1), 'yyyy-MM-dd'),
        format(addDays(today, 2), 'yyyy-MM-dd'),
        format(addDays(today, 3), 'yyyy-MM-dd'),
      ];

      const result = await getSmartSuggestions({
        ...data,
        commonBreaks: [{ start: "12:00", end: "13:00" }],
        typicalMeetingDuration: data.meetingDuration,
        availableDays,
      });

      if (result.length > 0) {
        setSuggestions(result);
      } else {
        toast({
          variant: "default",
          title: "No se encontraron sugerencias",
          description: "Intenta con diferentes parámetros o en otro momento.",
        });
      }
    });
  };

  const handleSelect = (suggestion: {start: string}) => {
    onSuggestionSelect(new Date(suggestion.start));
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="font-semibold">
          <Sparkles className="w-4 h-4 mr-2 text-accent" />
          Sugerencias IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Asistente de Agendamiento IA</DialogTitle>
          <DialogDescription>
            Encuentra el mejor horario para todos, considerando zonas horarias y descansos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="userTimeZone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tu Zona Horaria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                    <SelectContent>{timezones.map(tz => <SelectItem key={tz} value={tz}>{tz.split('/')[1].replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="hostTimeZone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Zona Horaria Anfitrión</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                    <SelectContent>{timezones.map(tz => <SelectItem key={tz} value={tz}>{tz.split('/')[1].replace('_', ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="meetingDuration" render={({ field }) => (
                <FormItem><FormLabel>Duración (minutos)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</> : "Obtener Sugerencias"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        {suggestions.length > 0 && (
            <div className="mt-6">
                <h3 className="font-semibold mb-2">Horarios sugeridos:</h3>
                <div className="grid grid-cols-2 gap-2">
                    {suggestions.slice(0, 4).map((s, i) => (
                        <Button key={i} variant="outline" onClick={() => handleSelect(s)}>
                            {format(new Date(s.start), "d MMM, HH:mm", {locale: es})}
                        </Button>
                    ))}
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
