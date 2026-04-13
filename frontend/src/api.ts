const API_BASE = '/api';

// Admin key for authorization
const ADMIN_KEY = 'admin123';

// Event type matching your backend
export interface Event {
  event_id: number;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  total_seats: number;
  booked_seats: number;
  available_seats: number;
  fill_percentage: string;
  ticket_price: string;
  event_status: string;
}

// Fetch all events (public)
export async function fetchEvents(): Promise<Event[]> {
  const response = await fetch(`${API_BASE}/events`);
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}

// Fetch events with admin stats (admin only)
export async function fetchAdminEvents(): Promise<Event[]> {
  const response = await fetch(`${API_BASE}/admin/events-stats`, {
    headers: {
      'x-admin-key': ADMIN_KEY
    }
  });
  if (!response.ok) throw new Error('Failed to fetch admin events');
  return response.json();
}

// Add new event (admin)
export async function addEventAPI(eventData: {
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  total_seats: number;
  ticket_price: number;
}) {
  const response = await fetch(`${API_BASE}/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY
    },
    body: JSON.stringify(eventData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add event');
  }
  return response.json();
}

// Update event (admin)
export async function updateEventAPI(eventId: number, eventData: Partial<Event>) {
  const response = await fetch(`${API_BASE}/admin/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY
    },
    body: JSON.stringify(eventData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update event');
  }
  return response.json();
}

// Delete event (admin)
export async function deleteEventAPI(eventId: number) {
  const response = await fetch(`${API_BASE}/admin/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'x-admin-key': ADMIN_KEY
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete event');
  }
  return response.json();
}