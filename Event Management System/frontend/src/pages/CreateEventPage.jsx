// frontend/src/pages/CreateEventPage.jsx
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import EventForm from '../components/forms/EventForm';

const CreateEventPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-slate-100 flex overflow-hidden">
            <Sidebar user={user} handleLogout={async () => { await logout(); navigate('/login'); }} />
            <main className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Create New Event</h1>
                        <p className="text-xs text-gray-500 mt-1">Fill in the details to create a new event.</p>
                    </div>
                    <button onClick={() => navigate('/organizer/events')}
                        className="text-xs font-medium px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition">
                        ← Back
                    </button>
                </header>
                <EventForm mode="create" />
            </main>
        </div>
    );
};
export default CreateEventPage;
