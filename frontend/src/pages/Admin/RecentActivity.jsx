import { useEffect, useState } from 'react';
import axios from '../../api/axios';

const activityIcons = {
  user_registered: '👤',
  owner_added: '🏠',
  room_added: '🛏️',
  room_updated: '✏️',
  room_deleted: '🗑️',
  payment_received: '💰',
  tenant_assigned: '🔑'
};

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const res = await axios.get('/activity/recent?limit=20');
      setActivities(res.data.activities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="recent-activity">
      <h3>Recent Activity</h3>
      {loading ? <p>Loading...</p> : activities.length === 0 ? <p>No recent activity</p> : (
        <ul>
          {activities.map(a => (
            <li key={a._id}>
              <span>{activityIcons[a.type] || '•'}</span>
              <span>{a.message}</span>
              <span>{timeAgo(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
