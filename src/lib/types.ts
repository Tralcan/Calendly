export type BusySlot = {
  start: Date;
  end: Date;
};

export type BookingDetails = {
  name: string;
  email: string;
  time: Date;
  meetingType: "30" | "60";
  notes?: string;
};

export type BookingResponse = {
  success: boolean;
  meetingLink?: string;
  message: string;
  bookingDetails?: {
    name: string;
    time: Date;
  };
};
