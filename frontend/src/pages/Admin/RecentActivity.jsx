import { useEffect, useState } from 'react';
import api from '../../api/axios';

const activityIcons = {
  user_registered: '👤',
  owner_added: '🏠',
  room_added: '🛏️',
  room_updated: '✏️',
  room_deleted: '🗑️',
  payment_received: '💰',
  tenant_assigned: '🔑',
  menu_view: '🍽️',
  ad_impression: '👁️',
  ad_click: '🖱️',
};

function cafeActivityMessage(event) {
  const cafe = `${event.cafe} · ${event.location}`;
  if (event.type === 'menu_view') return `Cafe menu opened: ${cafe}`;
  if (event.type === 'ad_impression') return `Ad shown: ${event.ad} · ${cafe}`;
  return `Ad clicked: ${event.ad} · ${cafe}`;
}

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
    const [activityResult, cafeResult] = await Promise.allSettled([
      api.get('/activity/recent?limit=20'),
      api.get('/promo-listings/admin/analytics', { params: { days: 7 } }),
    ]);
    if (activityResult.status === 'rejected') console.error('Recent admin activity fetch failed:', activityResult.reason);
    if (cafeResult.status === 'rejected') console.error('Recent cafe activity fetch failed:', cafeResult.reason);

    const adminActivities = activityResult.status === 'fulfilled'
      ? (activityResult.value.data.activities || [])
      : [];
    const recentEvents = cafeResult.status === 'fulfilled'
      ? (cafeResult.value.data.analytics?.recentEvents || [])
      : [];
    const cafeEvents = cafeResult.status === 'fulfilled'
      ? recentEvents.map((event, index) => ({
          ...event,
          _id: `cafe-${event.type}-${event.createdAt}-${index}`,
          message: cafeActivityMessage(event),
        }))
      : [];
    setActivities([...adminActivities, ...cafeEvents]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, 20));
    setLoading(false);
  };

  useEffect(() => {
    const initialFetch = setTimeout(fetchActivities, 0);
    const interval = setInterval(fetchActivities, 30000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
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
