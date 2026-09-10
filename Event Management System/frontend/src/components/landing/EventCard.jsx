// frontend/src/components/landing/EventCard.jsx
//
// RESPONSIBILITY: Reusable event card component for public event displays.
//
// UX Features:
//   1. Fully clickable card with pointer cursor, elevation, and ring hover effects.
//   2. "Register Now" action-oriented CTA button.
//   3. Seamless navigation to the event detail page (/events/:id).

import React from 'react';
import { Calendar, MapPin, Tag, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EventCard = ({ event }) => {
    const navigate = useNavigate();

    const title    = event.title;
    const category = event.category || 'Event';
    const price    = event.price || 'Free';
    const location = event.venue || event.location || 'Location TBA';
    const image    = event.image_url || event.image ||
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';

    // Format date
    const rawDate = event.event_date || event.date;
    const date = rawDate
        ? new Date(rawDate).toLocaleDateString('en-US', {
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

    // Navigate to event details
    const goToDetail = () => navigate(`/events/${event.id}`);

    return (
        // Entire card is an interactive clickable unit
        <div
            onClick={goToDetail}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && goToDetail()}
            className="
                bg-white rounded-2xl border border-gray-100 shadow-sm
                hover:shadow-xl hover:-translate-y-1 hover:ring-2 hover:ring-indigo-200
                transition-all duration-200 overflow-hidden flex flex-col group
                cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400
            "
        >
            {/* ── Event Thumbnail ─────────────────────────────────────────────── */}
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                    loading="lazy"
                />
                {/* Price badge */}
                <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-800 shadow-sm">
                    {price}
                </div>
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

                {/* ── Register Button ─────────────────────────────────────────── */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Avoid event propagation to parent container
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
            </div>
        </div>
    );
};

export default EventCard;
