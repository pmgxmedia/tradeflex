import Analytics from '../models/Analytics.js';

// @desc    Create or update analytics session
// @route   POST /api/analytics/session
// @access  Public
export const createOrUpdateSession = async (req, res) => {
  try {
    const { sessionId, userId, deviceId, userAgent, referrer } = req.body;

    let session = await Analytics.findOne({ sessionId });

    if (session) {
      // Update existing session
      session.endTime = new Date();
      session.calculateDuration();
      session.isActive = true;
      await session.save();
    } else {
      // Create new session
      session = await Analytics.create({
        sessionId,
        userId: userId || null,
        isRegistered: !!userId,
        deviceId,
        userAgent,
        referrer,
        startTime: new Date(),
        isActive: true,
      });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Track page view
// @route   POST /api/analytics/pageview
// @access  Public
export const trackPageView = async (req, res) => {
  try {
    const { sessionId, page } = req.body;

    const session = await Analytics.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.addPageView(page);
    session.endTime = new Date();
    session.calculateDuration();
    await session.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Track product view
// @route   POST /api/analytics/productview
// @access  Public
export const trackProductView = async (req, res) => {
  try {
    const { sessionId, productId, productName, category } = req.body;

    const session = await Analytics.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.addProductView(productId, productName, category);
    session.endTime = new Date();
    session.calculateDuration();
    await session.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End analytics session
// @route   POST /api/analytics/session/end
// @access  Public
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await Analytics.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.endTime = new Date();
    session.calculateDuration();
    session.isActive = false;
    await session.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get visitor statistics
// @route   GET /api/analytics/stats
// @access  Private/Admin
export const getVisitorStats = async (req, res) => {
  try {
    const { startDate, endDate, period = '30' } = req.query;
    
    const start = startDate 
      ? new Date(startDate) 
      : new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Analytics.getVisitorStats(start, end);

    // Get daily breakdown
    const dailyStats = await Analytics.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          },
          visits: { $sum: 1 },
          registeredVisits: {
            $sum: { $cond: ['$isRegistered', 1, 0] },
          },
          guestVisits: {
            $sum: { $cond: ['$isRegistered', 0, 1] },
          },
          totalDuration: { $sum: '$duration' },
          totalPageViews: { $sum: '$totalPages' },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ]);

    // Get hourly distribution for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hourlyStats = await Analytics.aggregate([
      {
        $match: {
          startTime: { $gte: today },
        },
      },
      {
        $group: {
          _id: { hour: { $hour: '$startTime' } },
          visits: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.hour': 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      stats,
      dailyStats,
      hourlyStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get popular content (products, categories, pages)
// @route   GET /api/analytics/popular
// @access  Private/Admin
export const getPopularContent = async (req, res) => {
  try {
    const { startDate, endDate, period = '30', limit = 10 } = req.query;
    
    const start = startDate 
      ? new Date(startDate) 
      : new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const popularContent = await Analytics.getPopularContent(start, end, parseInt(limit));

    res.status(200).json({
      success: true,
      ...popularContent,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user interests analysis
// @route   GET /api/analytics/interests
// @access  Private/Admin
export const getUserInterests = async (req, res) => {
  try {
    const { startDate, endDate, period = '30' } = req.query;
    
    const start = startDate 
      ? new Date(startDate) 
      : new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get common interests for registered vs guest users
    const [registeredInterests, guestInterests] = await Promise.all([
      // Registered users interests
      Analytics.aggregate([
        {
          $match: {
            startTime: { $gte: start, $lte: end },
            isRegistered: true,
            'interests.topCategories.0': { $exists: true },
          },
        },
        { $unwind: '$interests.topCategories' },
        {
          $group: {
            _id: '$interests.topCategories.category',
            totalViews: { $sum: '$interests.topCategories.viewCount' },
            uniqueUsers: { $addToSet: '$userId' },
          },
        },
        {
          $project: {
            category: '$_id',
            totalViews: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
          },
        },
        { $sort: { totalViews: -1 } },
        { $limit: 10 },
      ]),
      
      // Guest users interests
      Analytics.aggregate([
        {
          $match: {
            startTime: { $gte: start, $lte: end },
            isRegistered: false,
            'interests.topCategories.0': { $exists: true },
          },
        },
        { $unwind: '$interests.topCategories' },
        {
          $group: {
            _id: '$interests.topCategories.category',
            totalViews: { $sum: '$interests.topCategories.viewCount' },
            uniqueSessions: { $addToSet: '$sessionId' },
          },
        },
        {
          $project: {
            category: '$_id',
            totalViews: 1,
            uniqueSessions: { $size: '$uniqueSessions' },
          },
        },
        { $sort: { totalViews: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      registeredUserInterests: registeredInterests,
      guestUserInterests: guestInterests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get time spent analysis
// @route   GET /api/analytics/timespent
// @access  Private/Admin
export const getTimeSpentAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, period = '30' } = req.query;
    
    const start = startDate 
      ? new Date(startDate) 
      : new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const timeAnalysis = await Analytics.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: end },
          duration: { $gt: 0 },
        },
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                avgDuration: { $avg: '$duration' },
                maxDuration: { $max: '$duration' },
                totalSessions: { $sum: 1 },
              },
            },
          ],
          byUserType: [
            {
              $group: {
                _id: '$isRegistered',
                avgDuration: { $avg: '$duration' },
                sessions: { $sum: 1 },
              },
            },
          ],
          durationRanges: [
            {
              $bucket: {
                groupBy: '$duration',
                boundaries: [0, 30, 60, 180, 300, 600, 1800, 3600, Infinity],
                default: 'Other',
                output: {
                  count: { $sum: 1 },
                  avgDuration: { $avg: '$duration' },
                },
              },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      ...timeAnalysis[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get real-time active sessions
// @route   GET /api/analytics/active
// @access  Private/Admin
export const getActiveSessions = async (req, res) => {
  try {
    // Sessions active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeSessions = await Analytics.find({
      endTime: { $gte: fiveMinutesAgo },
      isActive: true,
    })
      .select('sessionId userId isRegistered startTime endTime duration totalPages categoriesViewed')
      .populate('userId', 'name email')
      .sort({ endTime: -1 })
      .limit(50);

    const activeCount = activeSessions.length;
    const registeredCount = activeSessions.filter(s => s.isRegistered).length;
    const guestCount = activeCount - registeredCount;

    res.status(200).json({
      success: true,
      activeCount,
      registeredCount,
      guestCount,
      sessions: activeSessions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
