import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface EventData {
  id: string;
  name: string;
  category: 'Technical' | 'Creative' | 'Sports' | 'Workshop';
  date: string;
  location: string;
  description: string;
  coordinatorId: string;
  tag: string;
  price: number;
  imageAlt: string;
  totalSeats?: number;
  bookedSeats?: number;
  availableSeats?: number;
  fillPercentage?: number;
}

interface EventContextType {
  allEvents: EventData[];
  addEvent: (event: Omit<EventData, 'id'>) => void;
  refreshEvents: () => Promise<void>;
  loading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

const API_BASE = '/api';

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();

      console.log('Raw data from API:', data);
      
      const formattedEvents: EventData[] = data.map((event: any) => {
        let category: EventData['category'] = 'Technical';
        const nameLower = event.event_name.toLowerCase();
        if (nameLower.includes('workshop')) category = 'Workshop';
        else if (nameLower.includes('sports')) category = 'Sports';
        else if (nameLower.includes('creative') || nameLower.includes('art')) category = 'Creative';
        
        const eventDate = new Date(event.event_date);
        const formattedDate = `${eventDate.toLocaleDateString()} • ${event.start_time} - ${event.end_time}`;

                return {
          id: event.event_id.toString(),
          name: event.event_name,
          category: category,
          date: formattedDate,
          location: event.venue || 'TBD',
          description: `${event.event_name} at ${event.venue || 'venue'}. ${event.available_seats} seats available. ${event.fill_percentage}% filled.`,
          coordinatorId: 'ADMIN-001',
          tag: parseFloat(event.fill_percentage) > 70 ? 'POPULAR' : 'NEW',
          price: parseFloat(event.ticket_price),
          imageAlt: event.event_name,
          totalSeats: event.total_seats,
          bookedSeats: event.booked_seats,
          availableSeats: event.available_seats,
          fillPercentage: parseFloat(event.fill_percentage)
        };
      });
     console.log('Formatted events:', formattedEvents);
      
      setAllEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add event via API
  const addEvent = async (event: Omit<EventData, 'id'>) => {
    try {
      const dateParts = event.date.split(' • ');
      const eventDate = new Date(dateParts[0]);
      const timeParts = dateParts[1]?.split(' - ') || ['10:00', '17:00'];
      
      const response = await fetch(`${API_BASE}/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'admin123'
        },
        body: JSON.stringify({
          event_name: event.name,
          event_date: eventDate.toISOString().split('T')[0],
          start_time: timeParts[0] || '10:00',
          end_time: timeParts[1] || '17:00',
          venue: event.location,
          total_seats: event.totalSeats || 100,
          ticket_price: event.price
        })
      });
      
      if (!response.ok) throw new Error('Failed to add event');
      
      // Refresh events list
      await fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  };

  // Expose refresh function
  const refreshEvents = async () => {
    await fetchEvents();
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <EventContext.Provider value={{ allEvents, addEvent, refreshEvents, loading }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};