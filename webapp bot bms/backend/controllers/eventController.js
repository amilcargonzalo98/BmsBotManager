import Event from '../models/Event.js';

export const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, groupId } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = {};
    if (groupId) {
      filter.groupId = groupId;
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate({ path: 'pointId', select: 'pointName' })
        .populate({ path: 'groupId', select: 'groupName' })
        .sort({ timestamp: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),
      Event.countDocuments(filter),
    ]);

    res.json({
      data: events,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: total > 0 ? Math.ceil(total / limitNumber) : 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
};
