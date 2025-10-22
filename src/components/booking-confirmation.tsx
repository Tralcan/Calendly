"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "./ui/button";
import { CheckCircle2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BookingConfirmationProps = {
  bookingDetails: {
    name: string;
    time: Date;
  };
  meetingLink: string;
  onReset: () => void;
};

export default function BookingConfirmation({ bookingDetails, meetingLink, onReset }: BookingConfirmationProps) {
  const { toast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    toast({
      title: "Enlace copiado",
      description: "El enlace de la reunión ha sido copiado a tu portapapeles.",
    });
  };
  
  return (
    <div className="text-center flex flex-col items-center justify-center h-full p-4">
      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
      <h2 className="font-headline text-2xl font-semibold mb-2">¡Reunión Agendada!</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Gracias, {bookingDetails.name}. Tu reunión ha sido confirmada y se ha enviado una invitación a tu correo.
      </p>
      
      <div className="bg-muted/50 rounded-lg p-4 w-full max-w-md text-left space-y-2 mb-6 text-sm">
        <p><strong>Fecha:</strong> {format(bookingDetails.time, "eeee, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
        <p><strong>Hora:</strong> {format(bookingDetails.time, "HH:mm", { locale: es })}</p>
        <div className="flex items-center justify-between">
            <p><strong>Enlace:</strong> <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">Google Meet</a></p>
            <Button size="icon" variant="ghost" onClick={handleCopyLink} className="h-7 w-7"><Copy className="h-4 w-4" /></Button>
        </div>
      </div>
      
      <Button onClick={onReset} className="w-full max-w-md bg-accent hover:bg-accent/90 text-accent-foreground">
        Agendar otra reunión
      </Button>
    </div>
  );
}
