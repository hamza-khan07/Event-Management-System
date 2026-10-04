// frontend/src/components/landing/EventCard.jsx
//
// RESPONSIBILITY: Reusable event card component for public event displays.
//
// UX Features:
//   1. Fully clickable card with pointer cursor, elevation, and ring hover effects.
//   2. "Register Now" CTA button — changes to "Registration Closed" when deadline passed.
//   3. Registration deadline badge shown when deadline is approaching (within 7 days).
//   4. Seamless navigation to the event detail page (/events/:id).

import React from 'react';
import { CheckCircle2, Calendar, MapPin, Tag, Ticket, Lock, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    isRegistrationClosed,
    daysUntilDeadline,
    formatLocalDate
} from '../../utils/dateUtils';

const EventCard = ({ event, isRegistered = false }) => {
    const navigate = useNavigate();

    const title    = event.title;
    const category = event.category || 'Event';
    const price    = event.price || 'Free';
    const location = event.venue || event.location || 'Location TBA';
    const image    = event.image_url || event.image ||
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';

    // Format event date (timezone-safe)
    const rawDate = event.event_date || event.date;
    const date = rawDate
        ? formatLocalDate(rawDate, {
            month: 'short', day: '2-digit', year: 'numeric'
          })
        : '';

    // Format time (HH:MM:SS → 9:00 AM)
    const rawTime = event.start_time || event.time;
    const time = rawTime && rawTime.includes(':') && !rawTime.includes('M')
        ? new Date(`1970-01-01T${rawTime}`).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
          })
        : rawTime || '';

    // ── Registration Deadline Logic ─────────────────────────────────────────
    // isRegistrationClosed uses the organizer-set closing time.
    const registrationClosed = isRegistrationClosed(
        event.registration_deadline,
        event.registration_deadline_time
    );
    const daysLeft = daysUntilDeadline(event.registration_deadline);

    // Detect if deadline is today
    const todayStr       = new Date().toLocaleDateString('sv-SE');
    const deadlineDayStr = String(event.registration_deadline || '').split('T')[0];
    const isDeadlineToday = deadlineDayStr === todayStr;

    // Format closing time for badge display (e.g. "5:00 PM")
    const deadlineTimeFormatted = event.registration_deadline_time
        ? new Date(`1970-01-01T${event.registration_deadline_time}`)
              .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : null;

    // Format deadline for display (e.g. "Sep 15, 2026")
    const deadlineFormatted = event.registration_deadline
        ? formatLocalDate(event.registration_deadline, {
            month: 'short', day: '2-digit', year: 'numeric'
          })
        : null;

    // Navigate to event details
    const goToDetail = () => navigate(`/events/${event.id}`);

    return (
        // Entire card is an interactive clickable unit
        <div
            onClick={goToDetail}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && goToDetail()}
            className={`
                bg-white rounded-2xl border shadow-sm
                hover:shadow-xl hover:-translate-y-1
                transition-all duration-200 overflow-hidden flex flex-col group
                cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400
                ${isRegistered
                    ? 'border-gray-200 hover:border-gray-300 hover:ring-2 hover:ring-gray-200'
                    : registrationClosed
                        ? 'border-gray-200 opacity-80'
                        : 'border-gray-100 hover:ring-2 hover:ring-indigo-200'
                }
            `}
        >
            {/* ── Event Thumbnail ─────────────────────────────────────── */}
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                    src={image}
                    alt={title}
                    className={`w-full h-full object-cover transition-transform duration-300 ease-out
                        ${registrationClosed ? 'grayscale-[20%]' : 'group-hover:scale-105'}`}
                    loading="lazy"
                />

                {/* Price badge — top right */}
                <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-800 shadow-sm">
                    {price}
                </div>

                {/* Deadline badge — top left, only shown when deadline exists */}
                {deadlineFormatted && (
                    <div className={`absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm
                        ${registrationClosed
                            ? 'bg-red-600 text-white'          // Red when closed
                            : daysLeft !== null && daysLeft <= 3
                                ? 'bg-amber-500 text-white'    // Amber when closing soon (≤3 days)
                                : 'bg-white/90 text-gray-700'  // White when plenty of time
                        }`}
                    >
                        {registrationClosed
                            ? <><Lock size={10} /> Closed</>
                            : isDeadlineToday
                                ? deadlineTimeFormatted
                                    ? <><Clock size={10} /> Closes at {deadlineTimeFormatted}</>
                                    : <><Clock size={10} /> Closes Today</>
                                : daysLeft === 0
                                    ? <><Clock size={10} /> Closes Today</>
                                    : daysLeft !== null && daysLeft <= 3
                                        ? <><Clock size={10} /> {daysLeft}d left</>
                                        : <><Clock size={10} /> Reg. by {deadlineFormatted}</>
                        }
                    </div>
                )}
            </div>

            {/* ── Content Body ────────────────────────────────────────────────── */}
            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    {/* Category */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 mb-2">
                        <Tag size={13} />
                        <span>{category}</span>
                    </div>

                    {/* Event Title */}
                    <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors mb-3 line-clamp-1">
                        {title}
                    </h3>

                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                        <Calendar size={15} className="text-gray-400 shrink-0" />
                        <span>{date}{time ? ` • ${time}` : ''}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <MapPin size={15} className="text-gray-400 shrink-0" />
                        <span className="truncate">{location}</span>
                    </div>
                </div>

                {/* ── Register Button / Closed State / Already Registered ──── */}
                {isRegistered ? (
                    // Already registered — locked grey button (clicking still takes user to event details)
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            goToDetail();
                        }}
                        className="w-full mt-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-sm select-none"
                        title="Already Registered — Click to view event details"
                    >
                        <Lock size={15} className="text-gray-500 shrink-0" />
                        <span>Already Registered</span>
                    </div>
                ) : registrationClosed ? (
                    // Registration closed state — non-interactive visual indicator
                    <div className="w-full mt-2 py-2.5 px-4 bg-gray-100 text-gray-400 text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-2 cursor-default">
                        <Lock size={15} />
                        <span>Registration Closed</span>
                    </div>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click from double-firing
                            goToDetail();
                        }}
                        className="
                            w-full mt-2 py-2.5 px-4
                            bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                            text-white text-sm font-semibold
                            rounded-xl text-center
                            transition-all duration-200
                            flex items-center justify-center gap-2
                            shadow-sm hover:shadow-md
                            cursor-pointer
                        "
                    >
                        <Ticket size={15} />
                        <span>Register Now</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default EventCard;
