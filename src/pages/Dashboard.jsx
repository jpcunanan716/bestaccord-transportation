import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Truck, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Package,
  MapPin,
  FileText,
  ArrowUpRight,
  Activity,
  BarChart3
} from 'lucide-react';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    upcoming: 0,
    ongoing: 0,
    pending: 0,
    delivered: 0,
    loading: true
  });

  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  // Fetch dashboard data from your API
  useEffect(() => {
    fetchDashboardData();
    fetchChartData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const bookings = await response.json();
      
      const counts = {
        upcoming: bookings.filter(booking => booking.status === 'Ready to go').length,
        ongoing: bookings.filter(booking => booking.status === 'In Transit').length,
        pending: bookings.filter(booking => booking.status === 'Pending').length,
        delivered: bookings.filter(booking => 
          booking.status === 'Delivered' || booking.status === 'Completed'
        ).length,
        loading: false
      };
      
      setDashboardData(counts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({
        upcoming: 50,
        ongoing: 20,
        pending: 25,
        delivered: 7,
        loading: false
      });
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const bookings = await response.json();
      
      // Process bookings data for the last 7 days
      const last7Days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        last7Days.push({
          date: date,
          dateStr: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          trips: 0
        });
      }
      
      // Count bookings created on each day
      bookings.forEach(booking => {
        if (booking.createdAt) {
          const bookingDate = new Date(booking.createdAt).toISOString().split('T')[0];
          const dayData = last7Days.find(day => day.dateStr === bookingDate);
          if (dayData) {
            dayData.trips++;
          }
        }
      });
      
      setChartData(last7Days);
      setChartLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Fallback data
      const fallbackData = [
        { dayName: 'Mon', trips: 12 },
        { dayName: 'Tue', trips: 8 },
        { dayName: 'Wed', trips: 15 },
        { dayName: 'Thu', trips: 10 },
        { dayName: 'Fri', trips: 18 },
        { dayName: 'Sat', trips: 6 },
        { dayName: 'Sun', trips: 9 }
      ];
      setChartData(fallbackData);
      setChartLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: (index) => ({ 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.25, 0.25, 0.75]
      }
    }),
    hover: { 
      scale: 1.02,
      y: -4,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  const cards = [
    {
      title: 'Upcoming Trips',
      count: dashboardData.upcoming,
      subtitle: 'Ready to start',
      icon: <Calendar className="w-7 h-7" />,
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100/70',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200/50',
      status: 'Ready to go'
    },
    {
      title: 'On-Going Trips',
      count: dashboardData.ongoing,
      subtitle: 'In progress',
      icon: <Truck className="w-7 h-7" />,
      bgGradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100/70',
      iconBg: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200/50',
      status: 'In Transit'
    },
    {
      title: 'Pending Reservations',
      count: dashboardData.pending,
      subtitle: 'Awaiting confirmation',
      icon: <Clock className="w-7 h-7" />,
      bgGradient: 'bg-gradient-to-br from-amber-50 to-amber-100/70',
      iconBg: 'bg-amber-500',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200/50',
      status: 'Pending'
    },
    {
      title: 'Delivered',
      count: dashboardData.delivered,
      subtitle: 'Successfully completed',
      icon: <CheckCircle className="w-7 h-7" />,
      bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100/70',
      iconBg: 'bg-purple-500',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200/50',
      status: 'Delivered',
      change: '+24%',
      change: '+24%'
    }
  ];

  const handleCardClick = (status) => {
    window.location.href = `/dashboard/booking?status=${encodeURIComponent(status)}`;
  };

  const totalTrips = dashboardData.upcoming + dashboardData.ongoing + dashboardData.pending + dashboardData.delivered;
  const maxChartValue = Math.max(...chartData.map(d => d.trips), 1);

  if (dashboardData.loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="text-center space-y-3">
          <div className="h-8 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square bg-white rounded-2xl shadow-sm animate-pulse border border-gray-100">
              <div className="p-6 h-full space-y-4">
                <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-emerald-600/5 rounded-2xl -z-10"></div>
        <div className="py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
            Dashboard
          </h1>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Live Updates</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Real-time Analytics</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            custom={index}
            onClick={() => handleCardClick(card.status)}
            className={`aspect-square ${card.bgGradient} rounded-2xl shadow-sm hover:shadow-lg cursor-pointer group transition-all duration-300 border-2 ${card.borderColor} relative overflow-hidden backdrop-blur-sm`}
          >
            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-white/5"></div>
            
            {/* Card Content */}
            <div className="p-6 h-full flex flex-col relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <div className="flex items-center space-x-1 text-xs font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-3xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform duration-200">
                  {card.count.toLocaleString()}
                </div>
                <h3 className={`text-sm font-semibold ${card.textColor} mb-1 leading-tight`}>
                  {card.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  {card.subtitle}
                </p>
                

              </div>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Trip Analytics Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Chart Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Trip Analytics</h2>
              <p className="text-sm text-gray-600">Daily booking trends over the last 7 days</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{totalTrips}</div>
              <div className="text-sm text-gray-500">Total Active</div>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {chartLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="flex items-end justify-between h-48 space-x-2 mb-6">
                {chartData.map((day, index) => (
                  <motion.div
                    key={`${day.dayName}-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: `${Math.max((day.trips / maxChartValue) * 100, 8)}%`,
                      opacity: 1
                    }}
                    transition={{ 
                      delay: 0.1 * index, 
                      duration: 0.8, 
                      ease: "easeOut" 
                    }}
                    className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg relative group shadow-sm hover:shadow-md transition-shadow duration-200"
                    style={{ minHeight: '12px' }}
                  >
                    {/* Enhanced Tooltip */}
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
                      <div className="font-semibold">{day.trips} bookings</div>
                      <div className="text-gray-300">{day.dayName}</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Chart Labels */}
              <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-4">
                {chartData.map((day, index) => (
                  <div key={`label-${index}`} className="flex-1 text-center">
                    <div className="font-medium">{day.dayName}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {day.date ? day.date.getDate() : ''}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Enhanced Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          {
            title: 'New Booking',
            description: 'Create a new booking request',
            icon: <Package className="w-5 h-5" />,
            color: 'blue',
            action: () => window.location.href = '/dashboard/booking'
          },
          {
            title: 'Track Vehicles',
            description: 'Monitor fleet and deliveries',
            icon: <MapPin className="w-5 h-5" />,
            color: 'emerald',
            action: () => window.location.href = '/dashboard/monitoring'
          },
          {
            title: 'Trip Reports',
            description: 'View analytics and reports',
            icon: <FileText className="w-5 h-5" />,
            color: 'purple',
            action: () => window.location.href = '/dashboard/trip-report'
          }
        ].map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-300 group cursor-pointer"
            onClick={action.action}
          >
            <div className="flex items-start space-x-4">
              <div className={`${
                action.color === 'blue' ? 'bg-blue-100' : 
                action.color === 'emerald' ? 'bg-emerald-100' : 'bg-purple-100'
              } p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                <div className={`${
                  action.color === 'blue' ? 'text-blue-600' : 
                  action.color === 'emerald' ? 'text-emerald-600' : 'text-purple-600'
                }`}>
                  {action.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                <button className={`w-full ${
                  action.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : 
                  action.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'
                } text-white py-2.5 px-4 rounded-lg transition-colors duration-300 text-sm font-medium group-hover:shadow-lg`}>
                  {action.title.includes('New') ? 'Create' : action.title.includes('Track') ? 'Monitor' : 'View'} Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}