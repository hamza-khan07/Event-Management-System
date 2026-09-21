import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getHeatmapData } from '../../services/eventService';
import { Loader2 } from 'lucide-react';

// This component updates the map's center when data loads
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const EventHeatMap = ({ events = [] }) => {
    // Filter events to only those with valid coordinates
    const validEvents = events.filter(e => e.latitude && e.longitude);

    if (validEvents.length === 0) {
        return (
            <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-500 font-medium">
                No active events with valid locations available on the map for the selected filters.
            </div>
        );
    }

    // Determine the center of the map based on the first valid event's coordinates
    const defaultCenter = [
        parseFloat(validEvents[0].latitude),
        parseFloat(validEvents[0].longitude)
    ];

    return (
        <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
            <MapContainer 
                center={defaultCenter} 
                zoom={6} 
                scrollWheelZoom={true}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapUpdater center={defaultCenter} />

                {/* Render hot spots for each valid event */}
                {validEvents.map((event) => (
                    <CircleMarker
                        key={event.id}
                        center={[parseFloat(event.latitude), parseFloat(event.longitude)]}
                        pathOptions={{ 
                            color: '#4f46e5', // Indigo-600 outline
                            fillColor: '#ef4444', // Red heatmap core
                            fillOpacity: 0.6,
                            weight: 2 
                        }}
                        radius={15} // Static radius (can be dynamic based on event capacity)
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-gray-900">{event.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">{event.category}</p>
                                <p className="text-xs font-semibold text-indigo-600 mt-2">
                                    Date: {new Date(event.event_date).toLocaleDateString()}
                                </p>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
};

export default EventHeatMap;
