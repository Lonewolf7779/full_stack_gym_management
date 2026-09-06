const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Normalizes any date input to UTC midnight Date object (00:00:00.000Z)
 * preserving local calendar day semantics.
 */
const normalizeDate = (input) => {
  if (!input) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

/**
 * @desc    Member self check-in for today
 * @route   POST /api/attendance/check-in
 * @access  Private (Member)
 */
const checkIn = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user._id });
    if (!member) {
      return errorResponse(res, 'Member profile not found.', null, 404);
    }

    const today = normalizeDate(new Date());

    // Check if already checked in today
    const existing = await Attendance.findOne({ member: member._id, date: today });
    if (existing) {
      return errorResponse(res, 'You have already checked in today.', null, 409);
    }

    const attendance = await Attendance.create({
      member: member._id,
      date: today,
      checkInTime: new Date(),
      status: 'active',
      markedBy: req.user._id,
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email role status' },
          { path: 'membershipPlan', select: 'name price duration' },
          {
            path: 'assignedTrainer',
            populate: { path: 'user', select: 'name email' },
          },
        ],
      })
      .populate('markedBy', 'name email role');

    return successResponse(res, 'Checked in successfully. Have a great workout!', {
      attendance: populatedAttendance,
    }, 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'You have already checked in today.', null, 409);
    }
    next(error);
  }
};

/**
 * @desc    Member self check-out for today
 * @route   PATCH /api/attendance/check-out
 * @access  Private (Member)
 */
const checkOut = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user._id });
    if (!member) {
      return errorResponse(res, 'Member profile not found.', null, 404);
    }

    const today = normalizeDate(new Date());
    const attendance = await Attendance.findOne({ member: member._id, date: today });

    if (!attendance) {
      return errorResponse(res, 'No active check-in found for today. Please check in first.', null, 404);
    }

    if (attendance.status === 'completed' || attendance.checkOutTime) {
      return errorResponse(res, 'You have already checked out today.', null, 400);
    }

    attendance.checkOutTime = new Date();
    attendance.status = 'completed';
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email role status' },
          { path: 'membershipPlan', select: 'name price duration' },
          {
            path: 'assignedTrainer',
            populate: { path: 'user', select: 'name email' },
          },
        ],
      })
      .populate('markedBy', 'name email role');

    return successResponse(res, 'Checked out successfully. Session recorded!', {
      attendance: populatedAttendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get member today's check-in status
 * @route   GET /api/attendance/me/today
 * @access  Private (Member)
 */
const getTodayStatus = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user._id });
    if (!member) {
      return successResponse(res, "Today's attendance status retrieved.", {
        isCheckedIn: false,
        isCompleted: false,
        attendance: null,
      });
    }

    const today = normalizeDate(new Date());
    const attendance = await Attendance.findOne({ member: member._id, date: today })
      .populate('markedBy', 'name email role');

    return successResponse(res, "Today's attendance status retrieved.", {
      isCheckedIn: !!attendance,
      isCompleted: attendance?.status === 'completed',
      attendance: attendance || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get member own attendance history and personal statistics
 * @route   GET /api/attendance/me
 * @access  Private (Member)
 */
const getMyAttendance = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user._id });
    if (!member) {
      return errorResponse(res, 'Member profile not found.', null, 404);
    }

    const records = await Attendance.find({ member: member._id })
      .sort({ date: -1, checkInTime: -1 })
      .populate('markedBy', 'name email role');

    // Calculate member statistics
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDayOfMonth = now.getDate();

    const thisMonthRecords = records.filter((r) => {
      const d = new Date(r.date);
      return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth;
    });

    const totalDays = records.length;
    const thisMonthDays = thisMonthRecords.length;
    const currentMonthPercentage = currentDayOfMonth > 0
      ? Math.min(100, Math.round((thisMonthDays / currentDayOfMonth) * 100))
      : 0;
    const completedSessions = records.filter((r) => r.status === 'completed').length;

    return successResponse(res, 'Personal attendance history retrieved.', {
      records,
      stats: {
        totalDays,
        thisMonthDays,
        currentMonthPercentage,
        completedSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance for members assigned to logged-in Trainer
 * @route   GET /api/attendance/trainer
 * @access  Private (Trainer)
 */
const getTrainerAttendance = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({ user: req.user._id });
    if (!trainer) {
      return errorResponse(res, 'Trainer profile not found.', null, 404);
    }

    const assignedMembers = await Member.find({ assignedTrainer: trainer._id })
      .populate('user', 'name email status');

    const assignedMemberIds = assignedMembers.map((m) => m._id);

    const { memberId, startDate, endDate, status, search } = req.query;

    const filter = {};

    if (memberId) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return errorResponse(res, 'Invalid member ID format.', null, 400);
      }
      const isAssigned = assignedMemberIds.some((id) => id.toString() === memberId.toString());
      if (!isAssigned) {
        return errorResponse(
          res,
          'Access denied: You can only view attendance for athletes on your coaching roster.',
          null,
          403
        );
      }
      filter.member = memberId;
    } else {
      filter.member = { $in: assignedMemberIds };
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = normalizeDate(startDate);
        if (s) filter.date.$gte = s;
      }
      if (endDate) {
        const e = normalizeDate(endDate);
        if (e) filter.date.$lte = e;
      }
    }

    let records = await Attendance.find(filter)
      .sort({ date: -1, checkInTime: -1 })
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email status' },
          { path: 'membershipPlan', select: 'name price duration' },
        ],
      })
      .populate('markedBy', 'name email role');

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (r) =>
          (r.member?.user?.name && r.member.user.name.toLowerCase().includes(q)) ||
          (r.member?.user?.email && r.member.user.email.toLowerCase().includes(q)) ||
          (r.member?.phone && r.member.phone.includes(q))
      );
    }

    const today = normalizeDate(new Date());
    const todayCheckIns = records.filter(
      (r) => r.date && r.date.getTime() === today.getTime()
    ).length;
    const currentlyActive = records.filter(
      (r) => r.date && r.date.getTime() === today.getTime() && r.status === 'active'
    ).length;

    return successResponse(res, 'Trainer roster attendance retrieved.', {
      records,
      stats: {
        totalRecords: records.length,
        todayCheckIns,
        currentlyActive,
        rosterCount: assignedMembers.length,
      },
      assignedMembers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all attendance records (Admin overview with filters)
 * @route   GET /api/attendance
 * @access  Private (Admin)
 */
const getAllAttendance = async (req, res, next) => {
  try {
    const { memberId, trainerId, status, startDate, endDate, date, search } = req.query;

    const filter = {};

    if (memberId) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return errorResponse(res, 'Invalid member ID format.', null, 400);
      }
      filter.member = memberId;
    }

    if (trainerId) {
      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return errorResponse(res, 'Invalid trainer ID format.', null, 400);
      }
      const trainerMembers = await Member.find({ assignedTrainer: trainerId }).select('_id');
      const memberIds = trainerMembers.map((m) => m._id);
      if (filter.member) {
        if (!memberIds.some((id) => id.toString() === filter.member.toString())) {
          return successResponse(res, 'All attendance records retrieved.', { records: [], count: 0 });
        }
      } else {
        filter.member = { $in: memberIds };
      }
    }

    if (status) {
      filter.status = status;
    }

    if (date) {
      const d = normalizeDate(date);
      if (d) filter.date = d;
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = normalizeDate(startDate);
        if (s) filter.date.$gte = s;
      }
      if (endDate) {
        const e = normalizeDate(endDate);
        if (e) filter.date.$lte = e;
      }
    }

    let records = await Attendance.find(filter)
      .sort({ date: -1, checkInTime: -1 })
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email status' },
          { path: 'membershipPlan', select: 'name price duration' },
          {
            path: 'assignedTrainer',
            populate: { path: 'user', select: 'name email' },
          },
        ],
      })
      .populate('markedBy', 'name email role');

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (r) =>
          (r.member?.user?.name && r.member.user.name.toLowerCase().includes(q)) ||
          (r.member?.user?.email && r.member.user.email.toLowerCase().includes(q)) ||
          (r.member?.phone && r.member.phone.includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    return successResponse(res, 'All attendance records retrieved.', {
      records,
      count: records.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get gym-wide attendance statistics (Admin)
 * @route   GET /api/attendance/stats
 * @access  Private (Admin)
 */
const getAttendanceStats = async (req, res, next) => {
  try {
    const today = normalizeDate(new Date());

    const totalRecords = await Attendance.countDocuments();
    const todayCheckIns = await Attendance.countDocuments({ date: today });
    const currentlyActive = await Attendance.countDocuments({ date: today, status: 'active' });
    const todayCompleted = await Attendance.countDocuments({ date: today, status: 'completed' });

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
    const thisMonthRecords = await Attendance.countDocuments({
      date: { $gte: startOfMonth },
    });

    return successResponse(res, 'Attendance statistics retrieved.', {
      stats: {
        totalRecords,
        todayCheckIns,
        currentlyActive,
        todayCompleted,
        thisMonthRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single attendance record by ID
 * @route   GET /api/attendance/:id
 * @access  Private (Admin / Trainer)
 */
const getAttendanceById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid attendance ID format.', null, 400);
    }

    const record = await Attendance.findById(req.params.id)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email status' },
          { path: 'membershipPlan', select: 'name price duration' },
          {
            path: 'assignedTrainer',
            populate: { path: 'user', select: 'name email' },
          },
        ],
      })
      .populate('markedBy', 'name email role');

    if (!record) {
      return errorResponse(res, 'Attendance record not found.', null, 404);
    }

    if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ user: req.user._id });
      if (!trainer || !record.member?.assignedTrainer?._id.equals(trainer._id)) {
        return errorResponse(res, 'Access denied to this attendance record.', null, 403);
      }
    }

    return successResponse(res, 'Attendance record retrieved.', { record });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin manual attendance creation
 * @route   POST /api/attendance
 * @access  Private (Admin)
 */
const createAttendance = async (req, res, next) => {
  try {
    const { memberId, date, checkInTime, checkOutTime, status, notes } = req.body;

    if (!memberId) {
      return errorResponse(res, 'Member ID is required.', null, 400);
    }
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return errorResponse(res, 'Invalid member ID format.', null, 400);
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return errorResponse(res, 'Member not found.', null, 404);
    }

    const normalizedDate = normalizeDate(date || new Date());
    if (!normalizedDate) {
      return errorResponse(res, 'Invalid date format provided.', null, 400);
    }

    const existing = await Attendance.findOne({ member: member._id, date: normalizedDate });
    if (existing) {
      return errorResponse(
        res,
        'Attendance record already exists for this member on the specified date.',
        null,
        409
      );
    }

    const inTime = checkInTime ? new Date(checkInTime) : new Date();
    const outTime = checkOutTime ? new Date(checkOutTime) : null;

    if (outTime && outTime < inTime) {
      return errorResponse(res, 'Check-out time cannot be earlier than check-in time.', null, 400);
    }

    const attendance = await Attendance.create({
      member: member._id,
      date: normalizedDate,
      checkInTime: inTime,
      checkOutTime: outTime,
      status: status || (outTime ? 'completed' : 'active'),
      markedBy: req.user._id,
      notes: notes || '',
    });

    const populated = await Attendance.findById(attendance._id)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email status' },
          { path: 'membershipPlan', select: 'name price duration' },
          {
            path: 'assignedTrainer',
            populate: { path: 'user', select: 'name email' },
          },
        ],
      })
      .populate('markedBy', 'name email role');

    return successResponse(res, 'Attendance record created successfully.', {
      attendance: populated,
    }, 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Attendance record already exists for this member on the specified date.', null, 409);
    }
    next(error);
  }
};

/**
 * @desc    Admin update/correct attendance record
 * @route   PATCH /api/attendance/:id
 * @access  Private (Admin)
 */
const updateAttendance = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid attendance ID format.', null, 400);
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return errorResponse(res, 'Attendance record not found.', null, 404);
    }

    const { date, checkInTime, checkOutTime, status, notes } = req.body;

    if (date !== undefined) {
      const newNormDate = normalizeDate(date);
      if (!newNormDate) {
        return errorResponse(res, 'Invalid date format provided.', null, 400);
      }
      if (newNormDate.getTime() !== attendance.date.getTime()) {
        const conflict = await Attendance.findOne({
          member: attendance.member,
          date: newNormDate,
          _id: { $ne: attendance._id },
        });
        if (conflict) {
          return errorResponse(
            res,
            'Another attendance record already exists for this member on the new date.',
            null,
            409
          );
        }
        attendance.date = newNormDate;
      }
    }

    let inTime = attendance.checkInTime;
    let outTime = attendance.checkOutTime;

    if (checkInTime !== undefined) {
      inTime = checkInTime ? new Date(checkInTime) : inTime;
      if (isNaN(inTime.getTime())) {
        return errorResponse(res, 'Invalid check-in time.', null, 400);
      }
      attendance.checkInTime = inTime;
    }

    if (checkOutTime !== undefined) {
      outTime = checkOutTime ? new Date(checkOutTime) : null;
      if (outTime && isNaN(outTime.getTime())) {
        return errorResponse(res, 'Invalid check-out time.', null, 400);
      }
      attendance.checkOutTime = outTime;
    }

    if (attendance.checkOutTime && attendance.checkInTime && attendance.checkOutTime < attendance.checkInTime) {
      return errorResponse(res, 'Check-out time cannot be earlier than check-in time.', null, 400);
    }

    if (status !== undefined) {
      if (!['active', 'completed'].includes(status)) {
        return errorResponse(res, 'Status must be either active or completed.', null, 400);
      }
      attendance.status = status;
    } else if (attendance.checkOutTime && attendance.status === 'active') {
      attendance.status = 'completed';
    }

    if (notes !== undefined) {
      attendance.notes = notes;
    }

    attendance.markedBy = req.user._id;
    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate({
        path: 'member',
        populate: [
          { path: 'user', select: 'name email status' },
          { path: 'membershipPlan', select: 'name price duration' },
          {
            path: 'assignedTrainer',
            populate: { path: 'user', select: 'name email' },
          },
        ],
      })
      .populate('markedBy', 'name email role');

    return successResponse(res, 'Attendance record updated successfully.', {
      attendance: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Another attendance record already exists for this member on this date.', null, 409);
    }
    next(error);
  }
};

/**
 * @desc    Admin delete attendance record
 * @route   DELETE /api/attendance/:id
 * @access  Private (Admin)
 */
const deleteAttendance = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 'Invalid attendance ID format.', null, 400);
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return errorResponse(res, 'Attendance record not found.', null, 404);
    }

    await Attendance.findByIdAndDelete(attendance._id);

    return successResponse(res, 'Attendance record deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getTrainerAttendance,
  getAllAttendance,
  getAttendanceStats,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  normalizeDate,
};