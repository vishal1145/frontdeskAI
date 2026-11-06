// Copy for the feature detail pages (/features/<slug>). Claims mirror what the product does
// (see backend/src/tools and backend/src/services); the call scripts are illustrative examples.
import {
  CalendarCheck, ShieldCheck, MessageSquare, AlertTriangle, Users, Volume2,
  Search, Clock, CalendarClock, Repeat, Lock, Timer, Hash, Shuffle, MapPin, Smartphone,
  UserCheck, PhoneForwarded, BellRing, Route, Stethoscope, Layers, ListChecks, Mic,
  Languages, Gauge, AudioLines,
} from 'lucide-react';

export const FEATURES = [
  {
    slug: 'live-availability-search',
    icon: CalendarCheck,
    title: 'Live Availability Search',
    summary: 'Converts spoken time requests into live calendar queries and offers open slots in real time.',
    lead: 'Callers ask the way people actually talk — “tomorrow evening”, “around 6 PM”, “with Dr. Sharma”. FrontDesk AI turns that into a live calendar query and offers slots that are genuinely open, while the caller is still on the line. The system understands relative dates and physician specialties in real time, offering the closest viable alternatives if a slot is taken. Confirmed bookings land straight on your active schedule with zero manual intervention.',
    facts: ['Natural-language dates & times', 'Doctor & service aware', 'Alternatives when a slot is taken'],
    script: [
      { who: 'caller', text: 'Do you have anything tomorrow evening with Dr. Sharma?' },
      { who: 'ai', text: 'Let me check Dr. Sharma’s calendar for tomorrow evening.' },
      { who: 'system', text: 'check_availability · tomorrow · evening · Dr. Sharma' },
      { who: 'ai', text: '6:00 PM and 7:30 PM are open. Which works better for you?' },
    ],
    result: { title: 'Open slots found', tone: 'blue', rows: [['6:00 PM', 'Available'], ['6:30 PM', 'Booked'], ['7:30 PM', 'Available']] },
    steps: [
      { title: 'Understands the request', text: 'Relative dates (“today”, “tomorrow”), time ranges (“morning”, “around 6 PM”), the doctor and the reason for visit are extracted from speech.' },
      { title: 'Queries the live calendar', text: 'The request becomes a structured availability check against your business’s real schedule — not a static list of hours.' },
      { title: 'Offers what is truly open', text: 'Matching slots are read back first; if the preferred time is taken, the nearest alternatives are offered instead.' },
    ],
    capabilities: [
      { icon: Search, title: 'Natural-language search', text: 'No keypad menus — callers simply speak when they would like to come in.' },
      { icon: CalendarClock, title: 'Real-time calendar', text: 'Every answer is based on the schedule at that moment, so callers never hear stale availability.' },
      { icon: Stethoscope, title: 'Doctor & service filters', text: 'Narrow results to a specific doctor or visit type in the same sentence.' },
      { icon: Repeat, title: 'Smart alternatives', text: 'When a time is full, open slots nearby are suggested so the booking still happens.' },
    ],
    outcomes: [
      { title: 'Fewer back-and-forth calls', text: 'Callers leave with a confirmed time instead of a promise to call back.' },
      { title: 'Accurate every time', text: 'Availability comes straight from the calendar, not from memory.' },
      { title: 'Works after hours', text: 'Appointments keep getting booked when the front desk is closed.' },
    ],
  },
  {
    slug: 'concurrency-slot-lock',
    icon: ShieldCheck,
    title: 'Concurrency Slot Lock',
    summary: 'High-speed in-memory locking prevents double-booking across simultaneous callers.',
    lead: 'When two callers reach for the same appointment at the same moment, only one can have it. An atomic, in-memory lock reserves the slot for the first confirmation and steers the second caller to another open time — no double-bookings, no awkward callbacks. High-volume peak calls are handled with zero race conditions, immediately guiding the second caller to the next best opening. Your schedule stays completely synchronized, preventing double-bookings even during your busiest calling rush.',
    facts: ['Atomic per-slot locking', 'Safe under simultaneous calls', 'Second caller gets alternatives'],
    script: [
      { who: 'caller', text: 'Caller A: I’ll take 11:00 AM on Friday.' },
      { who: 'caller', text: 'Caller B: Can I book Friday at 11:00 AM?' },
      { who: 'system', text: 'Lock acquired · Fri 11:00 AM → Caller A' },
      { who: 'ai', text: 'To Caller B: 11:00 just got booked — 11:30 AM is free. Shall I reserve it?' },
    ],
    result: { title: 'Slot secured', tone: 'green', rows: [['Fri 11:00 AM', 'Locked · Caller A'], ['Fri 11:30 AM', 'Offered · Caller B']] },
    steps: [
      { title: 'One gate per slot', text: 'Each schedule-and-time pair has its own lock, so confirmations for the same slot are processed strictly one at a time.' },
      { title: 'First confirmation wins', text: 'The first caller to confirm reserves the slot together with their name, number and booking ID.' },
      { title: 'Everyone else is redirected', text: 'Later requests for that slot are told it is taken and are offered the next open times instead.' },
    ],
    capabilities: [
      { icon: Lock, title: 'Atomic reservations', text: 'Check-and-reserve happens as a single step, so there is no gap for a race condition.' },
      { icon: Timer, title: 'In-memory speed', text: 'Locks resolve in memory, keeping the conversation natural even under load.' },
      { icon: Hash, title: 'Booking ID on lock', text: 'Each reserved slot carries the booking reference used in the confirmation.' },
      { icon: Shuffle, title: 'Graceful collisions', text: 'A taken slot never ends a call — the caller simply hears the next best option.' },
    ],
    outcomes: [
      { title: 'Zero double-bookings', text: 'Two patients are never told the same time.' },
      { title: 'Calm busy hours', text: 'Many simultaneous callers are handled without conflicts.' },
      { title: 'Trust in the schedule', text: 'Your team can rely on the calendar exactly as it is.' },
    ],
  },
  {
    slug: 'instant-whatsapp-slips',
    icon: MessageSquare,
    title: 'Instant WhatsApp Slips',
    summary: 'Sends instant WhatsApp confirmations with booking ID, staff name, and location directions.',
    lead: 'The moment an appointment is confirmed, the caller receives a clear WhatsApp slip with their booking ID, who they are seeing, when, and a map link to find you — with an SMS fallback for phones without WhatsApp. Delivery happens automatically via official Meta Cloud APIs, including clinic address, GPS navigation, and instructions to drastically reduce no-shows. Patients always arrive well-prepared with verified confirmation records saved directly on their phone.',
    facts: ['Sent as soon as booking completes', 'Booking ID, doctor & time', 'Google Maps directions'],
    script: [
      { who: 'ai', text: 'You’re booked with Dr. Sharma tomorrow at 6:00 PM.' },
      { who: 'ai', text: 'I’ve sent the details to your WhatsApp.' },
      { who: 'system', text: 'WhatsApp slip delivered · SMS fallback ready' },
    ],
    result: { title: 'Appointment confirmed', tone: 'green', rows: [['Booking ID', 'FD-2741'], ['Doctor', 'Dr. Sharma'], ['When', 'Tomorrow · 6:00 PM'], ['Location', 'Open in Google Maps']] },
    steps: [
      { title: 'Booking completes', text: 'As soon as the slot is locked and saved, the confirmation is prepared automatically.' },
      { title: 'Slip is composed', text: 'The patient’s name, doctor, time, booking ID and a Google Maps link to your address are filled in.' },
      { title: 'Delivered instantly', text: 'The slip goes out on WhatsApp; an SMS version covers keypad phones and landlines.' },
    ],
    capabilities: [
      { icon: Hash, title: 'Booking reference', text: 'A unique booking ID the patient can quote at the desk.' },
      { icon: UserCheck, title: 'Staff & time', text: 'Clearly states who they are seeing and exactly when.' },
      { icon: MapPin, title: 'One-tap directions', text: 'A Google Maps link to your business so clients arrive without calling back.' },
      { icon: Smartphone, title: 'SMS fallback', text: 'A short SMS confirmation reaches phones without WhatsApp.' },
    ],
    outcomes: [
      { title: 'Fewer no-shows', text: 'Patients have the details in writing, right on their phone.' },
      { title: 'Fewer “where are you?” calls', text: 'Directions are included with every confirmation.' },
      { title: 'A professional first impression', text: 'Every booking ends with a clean, branded confirmation.' },
    ],
  },
  {
    slug: 'urgent-call-escalation',
    icon: AlertTriangle,
    title: 'Urgent Call Escalation',
    summary: 'Bridges callers directly to on-call staff whenever high-priority emergencies are detected.',
    lead: 'Some calls cannot wait for an appointment. When a caller describes an emergency or asks for a person, FrontDesk AI transfers the call live to your receptionist, doctor or emergency contact — and records why. Our voice engine continuously evaluates conversational tone and acute symptom keywords, pausing routine booking to initiate an immediate live phone transfer. Designated duty staff receive high-priority callers instantly without dropping the live voice connection.',
    facts: ['Live call transfer', 'Emergency & human-request triggers', 'Reason logged with the call'],
    script: [
      { who: 'caller', text: 'My father has severe chest pain — I need to speak to the doctor now.' },
      { who: 'system', text: 'Priority detected · acute medical emergency' },
      { who: 'ai', text: 'I’m connecting you to the on-call doctor right now. Please stay on the line.' },
    ],
    result: { title: 'Call transferred', tone: 'amber', rows: [['Reason', 'Acute medical emergency'], ['Routed to', 'On-call doctor'], ['Status', 'Connected live']] },
    steps: [
      { title: 'Recognises urgency', text: 'Emergencies and requests for a human are identified during the conversation, not after it.' },
      { title: 'Transfers live', text: 'The caller is bridged to your on-call staff or emergency line without hanging up.' },
      { title: 'Keeps a record', text: 'The transfer reason and destination are saved with the call log for follow-up.' },
    ],
    capabilities: [
      { icon: BellRing, title: 'Priority detection', text: 'Urgent language and explicit requests for staff trigger escalation.' },
      { icon: PhoneForwarded, title: 'Warm hand-off', text: 'The call is transferred while the caller stays connected.' },
      { icon: Route, title: 'Configurable routing', text: 'Send escalations to the right person for your business.' },
      { icon: ListChecks, title: 'Logged reasons', text: 'Every transfer shows why it happened in the portal’s call logs.' },
    ],
    outcomes: [
      { title: 'Emergencies reach people', text: 'Critical calls go straight to someone who can act.' },
      { title: 'Callers feel heard', text: 'Anyone who asks for a person can reach one.' },
      { title: 'Full visibility', text: 'Your team can review every escalation afterwards.' },
    ],
  },
  {
    slug: 'multi-department-staff-calendars',
    icon: Users,
    title: 'Multi-Department Calendars',
    summary: 'Manages multi-staff schedules and rotating shifts, booking appointments on live availability.',
    lead: 'Every doctor has their own specialties and timings. FrontDesk AI knows who works when and what they handle, so each caller is matched to the right person and booked into a time that person is actually available. The system cross-references patient symptoms with provider expertise, respecting individual buffers and consultation hours without internal call transfers. Staff rosters stay organized and evenly balanced across all clinic locations and departments.',
    facts: ['Per-doctor timings', 'Specialty-aware matching', 'Bookings on live availability'],
    script: [
      { who: 'caller', text: 'I need a dental check-up on Saturday morning.' },
      { who: 'system', text: 'Matching specialty · Dentist · Sat morning' },
      { who: 'ai', text: 'Dr. Sharma handles dental check-ups and has 10:30 AM free on Saturday.' },
    ],
    result: { title: 'Matched to the right doctor', tone: 'blue', rows: [['Service', 'Dental check-up'], ['Doctor', 'Dr. Sharma'], ['Slot', 'Sat · 10:30 AM']] },
    steps: [
      { title: 'Knows your team', text: 'Each doctor’s specialties and working timings are part of your business profile.' },
      { title: 'Matches the request', text: 'The visit reason or a requested name is matched to the doctors who can take it.' },
      { title: 'Books live availability', text: 'Only times inside that doctor’s schedule — and still open — are offered.' },
    ],
    capabilities: [
      { icon: Stethoscope, title: 'Specialty routing', text: 'Callers are steered to doctors who handle their need.' },
      { icon: Clock, title: 'Individual timings', text: 'Each staff member’s hours are respected automatically.' },
      { icon: Layers, title: 'Many calendars, one line', text: 'All departments are reachable through your single existing number.' },
      { icon: CalendarCheck, title: 'Live booking', text: 'Appointments land straight on the right person’s calendar.' },
    ],
    outcomes: [
      { title: 'Right doctor, first time', text: 'No more transferring callers between departments.' },
      { title: 'Balanced schedules', text: 'Bookings follow real availability across your team.' },
      { title: 'Scales with your business', text: 'Add doctors and services without changing your phone setup.' },
    ],
  },
  {
    slug: 'natural-voice-intelligence',
    icon: Volume2,
    title: 'Natural Voice Intelligence',
    summary: 'Responds with natural human warmth and sub-second voice latency.',
    lead: 'Callers should feel they are talking to a thoughtful receptionist, not a phone menu. FrontDesk AI listens, understands mixed and bilingual phrasing, and replies warmly with sub-second latency — so conversations flow naturally. Powered by real-time speech models, it effortlessly handles Indian regional accents, colloquial phrasing, and mid-sentence clarifications with professional front-desk warmth. Every caller enjoys a polite, attentive conversation that leaves a lasting positive impression.',
    facts: ['Sub-second responses', 'Understands accents & bilingual phrasing', 'Warm, conversational tone'],
    script: [
      { who: 'caller', text: 'Hello, kal subah appointment mil sakta hai?' },
      { who: 'ai', text: 'Namaste! Haan, kal subah 10:30 aur 11:00 available hain. Kaunsa time theek rahega?' },
      { who: 'caller', text: '10:30 is perfect, thank you.' },
    ],
    result: { title: 'Natural conversation', tone: 'blue', rows: [['Language', 'Hindi + English'], ['Response time', 'Sub-second'], ['Tone', 'Warm & conversational']] },
    steps: [
      { title: 'Listens in real time', text: 'Speech is streamed and understood as the caller talks, including accents and mixed languages.' },
      { title: 'Understands intent', text: 'The assistant follows context across the conversation instead of matching keywords.' },
      { title: 'Replies naturally', text: 'Answers are spoken back quickly in a friendly, human cadence.' },
    ],
    capabilities: [
      { icon: Mic, title: 'Streaming speech', text: 'No “press 1” menus — callers simply speak.' },
      { icon: Languages, title: 'Bilingual phrasing', text: 'Handles everyday Hindi–English mixing naturally.' },
      { icon: Gauge, title: 'Sub-second latency', text: 'Fast replies keep the rhythm of a real conversation.' },
      { icon: AudioLines, title: 'Warm delivery', text: 'A calm, polite voice that represents your business well.' },
    ],
    outcomes: [
      { title: 'Callers stay on the line', text: 'Natural conversations mean fewer hang-ups.' },
      { title: 'Inclusive for every caller', text: 'Accents and mixed languages are understood.' },
      { title: 'Your brand, well spoken', text: 'Every call sounds considered and professional.' },
    ],
  },
];

export const FEATURE_SLUGS = FEATURES.map((f) => f.slug);
