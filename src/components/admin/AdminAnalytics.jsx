import { useState, useEffect } from 'react';
import { 
  getVisitorStats, 
  getPopularContent, 
  getUserInterests, 
  getTimeSpentAnalysis,
  getActiveSessions 
} from '../../services/api';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { 
  FiUsers, 
  FiUserCheck, 
  FiUserX, 
  FiClock, 
  FiEye, 
  FiTrendingUp,
  FiActivity,
  FiBarChart2
} from 'react-icons/fi';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [popularContent, setPopularContent] = useState(null);
  const [interests, setInterests] = useState(null);
  const [timeSpent, setTimeSpent] = useState(null);
  const [activeSessions, setActiveSessions] = useState(null);
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    fetchAnalytics();
    // Refresh active sessions every 30 seconds
    const interval = setInterval(fetchActiveSessions, 30000);
    return () => clearInterval(interval);
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchPopularContent(),
        fetchInterests(),
        fetchTimeSpent(),
        fetchActiveSessions(),
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getVisitorStats({ period });
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPopularContent = async () => {
    try {
      const data = await getPopularContent({ period, limit: 5 });
      setPopularContent(data);
    } catch (error) {
      console.error('Error fetching popular content:', error);
    }
  };

  const fetchInterests = async () => {
    try {
      const data = await getUserInterests({ period });
      setInterests(data);
    } catch (error) {
      console.error('Error fetching interests:', error);
    }
  };

  const fetchTimeSpent = async () => {
    try {
      const data = await getTimeSpentAnalysis({ period });
      setTimeSpent(data);
    } catch (error) {
      console.error('Error fetching time spent:', error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const data = await getActiveSessions();
      setActiveSessions(data);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (minutes === 0) return `${secs}s`;
    return `${minutes}m ${secs}s`;
  };

  const getDurationRangeLabel = (boundary) => {
    const ranges = {
      0: '0-30s',
      30: '30s-1m',
      60: '1-3m',
      180: '3-5m',
      300: '5-10m',
      600: '10-30m',
      1800: '30m-1h',
      3600: '1h+',
    };
    return ranges[boundary] || 'Other';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Website Analytics</h2>
          <p className="text-gray-600 mt-1">Monitor visitor behavior and engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 font-medium">Period:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Real-time Active Sessions */}
      {activeSessions && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiActivity className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Active Visitors Now</h3>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="text-3xl font-bold text-green-600">{activeSessions.activeCount}</p>
                  <p className="text-sm text-gray-600">Total Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{activeSessions.registeredCount}</p>
                  <p className="text-sm text-gray-600">Registered</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{activeSessions.guestCount}</p>
                  <p className="text-sm text-gray-600">Guests</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Visitor Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.totalVisits}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.stats.avgPagesPerVisit.toFixed(1)} pages/visit
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registered Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.registeredVisits}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.stats.totalVisits > 0 
                    ? ((stats.stats.registeredVisits / stats.stats.totalVisits) * 100).toFixed(1)
                    : 0}% of total
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiUserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Guest Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.guestVisits}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.stats.totalVisits > 0 
                    ? ((stats.stats.guestVisits / stats.stats.totalVisits) * 100).toFixed(1)
                    : 0}% of total
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiUserX className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg. Time on Site</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(stats.stats.avgDuration)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.stats.totalPageViews} total page views
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiClock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Visitor Trend */}
        {stats && stats.dailyStats && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiTrendingUp className="w-5 h-5 mr-2" />
              Daily Visitor Trend
            </h3>
            <div className="space-y-2">
              {stats.dailyStats.slice(-7).map((day, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">{day._id.date}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ 
                        width: `${(day.visits / Math.max(...stats.dailyStats.map(d => d.visits))) * 100}%`,
                        minWidth: '30px'
                      }}
                    >
                      <span className="text-xs text-white font-medium">{day.visits}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">{day.registeredVisits} reg</span>
                    <span className="text-purple-600">{day.guestVisits} guest</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Time Spent Distribution */}
        {timeSpent && timeSpent.durationRanges && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiClock className="w-5 h-5 mr-2" />
              Time Spent Distribution
            </h3>
            <div className="space-y-2">
              {timeSpent.durationRanges.map((range, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20">{getDurationRangeLabel(range._id)}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-orange-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ 
                        width: `${(range.count / Math.max(...timeSpent.durationRanges.map(r => r.count))) * 100}%`,
                        minWidth: '30px'
                      }}
                    >
                      <span className="text-xs text-white font-medium">{range.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Popular Content and Interests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Viewed Products */}
        {popularContent && popularContent.popularProducts && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiEye className="w-5 h-5 mr-2" />
              Most Viewed Products
            </h3>
            <div className="space-y-3">
              {popularContent.popularProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
                    <p className="text-xs text-gray-500">{product.category || 'Uncategorized'}</p>
                  </div>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    {product.views}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Registered User Interests */}
        {interests && interests.registeredUserInterests && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiBarChart2 className="w-5 h-5 mr-2" />
              Registered User Interests
            </h3>
            <div className="space-y-3">
              {interests.registeredUserInterests.map((interest, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{interest.category}</p>
                    <p className="text-xs text-gray-500">{interest.uniqueUsers} users</p>
                  </div>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    {interest.totalViews}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Guest User Interests */}
        {interests && interests.guestUserInterests && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiBarChart2 className="w-5 h-5 mr-2" />
              Guest User Interests
            </h3>
            <div className="space-y-3">
              {interests.guestUserInterests.map((interest, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{interest.category}</p>
                    <p className="text-xs text-gray-500">{interest.uniqueSessions} sessions</p>
                  </div>
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                    {interest.totalViews}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Average Time Spent by User Type */}
      {timeSpent && timeSpent.byUserType && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Time Spent by User Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {timeSpent.byUserType.map((type, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-16 h-16 ${type._id ? 'bg-green-100' : 'bg-purple-100'} rounded-lg flex items-center justify-center`}>
                  {type._id ? (
                    <FiUserCheck className="w-8 h-8 text-green-600" />
                  ) : (
                    <FiUserX className="w-8 h-8 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{type._id ? 'Registered Users' : 'Guest Visitors'}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(type.avgDuration)}</p>
                  <p className="text-xs text-gray-500">{type.sessions} sessions</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalytics;
