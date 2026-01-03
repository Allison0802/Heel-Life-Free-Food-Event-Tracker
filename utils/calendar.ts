import { CampusEvent } from '../types';

/**
 * Formats a date string for Google Calendar URL (YYYYMMDDTHHmmSSZ)
 */
const formatGoogleCalendarDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
};

/**
 * Generates a Google Calendar "Add Event" link
 */
export const generateGoogleCalendarLink = (event: CampusEvent): string => {
  const start = formatGoogleCalendarDate(event.startDate);
  const end = formatGoogleCalendarDate(event.endDate);
  
  const details = `${event.description}\n\nSource: ${event.sourceUrl || 'HeelLife Tracker'}`;
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: details,
    location: event.location,
    trp: 'true', // Busy
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generates an .ics file content for download
 */
export const generateICSFile = (event: CampusEvent): string => {
  const start = formatGoogleCalendarDate(event.startDate);
  const end = formatGoogleCalendarDate(event.endDate);
  const now = formatGoogleCalendarDate(new Date().toISOString());
  
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HeelLife//FreeFoodTracker//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@heellife-tracker`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return `data:text/calendar;charset=utf8,${encodeURIComponent(content)}`;
};

/**
 * Generates a Batch .ics file content for download containing multiple events
 */
export const generateBatchICSFile = (events: CampusEvent[]): string => {
  const now = formatGoogleCalendarDate(new Date().toISOString());

  const eventBlocks = events.map(event => {
    const start = formatGoogleCalendarDate(event.startDate);
    const end = formatGoogleCalendarDate(event.endDate);
    return [
      'BEGIN:VEVENT',
      `UID:${event.id}@heellife-tracker`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HeelLife//FreeFoodTracker//EN',
    eventBlocks,
    'END:VCALENDAR'
  ].join('\r\n');

  return `data:text/calendar;charset=utf8,${encodeURIComponent(content)}`;
};

/**
 * Formats a date for display (e.g., "Mon, Oct 25 • 2:00 PM")
 */
export const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};