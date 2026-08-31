// frontend/src/pages/EditEventPage.jsx
import { useAuth } from '../Context/AuthContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import EventForm from '../components/forms/EventForm';

const EditEventPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const eventData = location.state?.event;

    useEffect(() => {
        if (!eventData) navigate('/organizer/events'); // Refresh pe wapas bhejo
    }, [eventData, navigate]);

    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            <Sidebar user={user} handleLogout={async () => { await logout(); navigate('/login'); }} />
            <main className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Edit Event</h1>
                        <p className="text-xs text-gray-500 mt-1">Updating: {eventData?.title}</p>
                    </div>
                    <button onClick={() => navigate('/organizer/events')}
                        className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition">
                        ← Back to Events
                    </button>
                </header>
                {eventData && <EventForm mode="edit" eventData={eventData} eventId={id} />}
            </main>
        </div>
    );
};
export default EditEventPage;
