const Member = require('../models/Member');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const MembershipPlan = require('../models/MembershipPlan');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all members (Admin sees all; Trainer sees only assigned members)
 * @route   GET /api/members
 * @access  Private (Admin / Trainer)
 */
const getMembers = async (req, res, next) => {
  try {
    const { search, status, planId, trainerId } = req.query;
    const filter = {};

    // Trainer Role Restriction: Only see assigned members
    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc) {
        return successResponse(res, 'No assigned members found.', { members: [], count: 0 });
      }
      filter.assignedTrainer = trainerDoc._id;
    } else if (req.user.role === 'member') {
      return errorResponse(res, 'Access denied: Members cannot list all member records.', null, 403);
    }

    if (status) {
      filter.status = status;
    }

    if (planId) {
      filter.membershipPlan = planId;
    }

    if (trainerId && req.user.role === 'admin') {
      filter.assignedTrainer = trainerId;
    }

    let members = await Member.find(filter)
      .populate('user', 'name email role createdAt')
      .populate('membershipPlan', 'name price duration features')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    // In-memory search filter for user name / email / phone
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      members = members.filter(
        (m) =>
          (m.user && (searchRegex.test(m.user.name) || searchRegex.test(m.user.email))) ||
          searchRegex.test(m.phone) ||
          (m.membershipPlan && searchRegex.test(m.membershipPlan.name))
      );
    }

    return successResponse(res, 'Members retrieved successfully.', {
      members,
      count: members.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single member by ID
 * @route   GET /api/members/:id
 * @access  Private (Admin, Assigned Trainer, or Owner Member)
 */
const getMemberById = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('user', 'name email role createdAt')
      .populate('membershipPlan', 'name price duration features status')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name email' },
      });

    if (!member) {
      return errorResponse(res, 'Member not found.', null, 404);
    }

    // Role-based Access Control Verification
    if (req.user.role === 'trainer') {
      const trainerDoc = await Trainer.findOne({ user: req.user._id });
      if (!trainerDoc || !member.assignedTrainer || member.assignedTrainer._id.toString() !== trainerDoc._id.toString()) {
        return errorResponse(res, 'Access denied: This member is not assigned to your coaching roster.', null, 403);
      }
    } else if (req.user.role === 'member') {
      if (member.user._id.toString() !== req.user._id.toString()) {
        return errorResponse(res, 'Access denied: You can only view your own member profile.', null, 403);
      }
    }

    return successResponse(res, 'Member details retrieved.', { member });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated member profile
 * @route   GET /api/members/me/profile
 * @access  Private (Member only)
 */
const getMemberProfile = async (req, res, next) => {
  try {
    let member = await Member.findOne({ user: req.user._id })
      .populate('user', 'name email role createdAt')
      .populate('membershipPlan', 'name price duration features status')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name email' },
      });

    // Auto-create empty member profile if registered but profile document not created yet
    if (!member) {
      member = await Member.create({
        user: req.user._id,
        status: 'active',
      });
      member = await Member.findById(member._id).populate('user', 'name email role createdAt');
    }

    // Calculate days remaining if active membership exists
    let daysRemaining = 0;
    if (member.membershipEndDate) {
      const diffMs = new Date(member.membershipEndDate) - new Date();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    return successResponse(res, 'Member profile retrieved.', {
      member: {
        ...member.toObject(),
        daysRemaining,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new member (Admin only)
 * @route   POST /api/members
 * @access  Private (Admin only)
 */
const createMember = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      membershipPlan,
      assignedTrainer,
      status,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 'Member name is required.', null, 400);
    }
    if (!email || !email.trim()) {
      return errorResponse(res, 'Member email is required.', null, 400);
    }
    if (!password || password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters.', null, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists.', null, 409);
    }

    // Create User with enforced 'member' role
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'member',
    });

    // Calculate membership dates if plan assigned
    let startDate = null;
    let endDate = null;
    if (membershipPlan) {
      const planDoc = await MembershipPlan.findById(membershipPlan);
      if (planDoc) {
        startDate = new Date();
        endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (planDoc.duration || 1));
      }
    }

    const member = await Member.create({
      user: user._id,
      phone: phone || '',
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'unspecified',
      address: address || '',
      emergencyContact: emergencyContact || { name: '', phone: '', relation: '' },
      membershipPlan: membershipPlan || null,
      membershipStartDate: startDate,
      membershipEndDate: endDate,
      assignedTrainer: assignedTrainer || null,
      status: status || 'active',
      notes: notes || '',
    });

    const populatedMember = await Member.findById(member._id)
      .populate('user', 'name email role')
      .populate('membershipPlan', 'name price duration')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name email' },
      });

    return successResponse(
      res,
      'Member created successfully.',
      { member: populatedMember },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update member
 * @route   PUT /api/members/:id
 * @access  Private (Admin or Owner Member)
 */
const updateMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return errorResponse(res, 'Member not found.', null, 404);
    }

    // Role check: Only admin or the specific member can update
    const isOwner = member.user.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return errorResponse(res, 'Access denied: You cannot update another member profile.', null, 403);
    }

    const {
      name,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      membershipPlan,
      assignedTrainer,
      status,
      notes,
    } = req.body;

    // Update User name
    if (name && name.trim()) {
      await User.findByIdAndUpdate(member.user, { name: name.trim() });
    }

    // Update common profile fields
    if (phone !== undefined) member.phone = phone;
    if (dateOfBirth !== undefined) member.dateOfBirth = dateOfBirth;
    if (gender !== undefined) member.gender = gender;
    if (address !== undefined) member.address = address;
    if (emergencyContact !== undefined) member.emergencyContact = emergencyContact;

    // Admin-only fields: Membership Plan & Trainer Assignment & Status
    if (req.user.role === 'admin') {
      if (membershipPlan !== undefined) {
        // If plan changed or newly assigned, calculate new end date
        if (membershipPlan && membershipPlan !== (member.membershipPlan ? member.membershipPlan.toString() : '')) {
          const planDoc = await MembershipPlan.findById(membershipPlan);
          if (planDoc) {
            member.membershipPlan = planDoc._id;
            member.membershipStartDate = new Date();
            const newEndDate = new Date();
            newEndDate.setMonth(newEndDate.getMonth() + (planDoc.duration || 1));
            member.membershipEndDate = newEndDate;
          }
        } else if (!membershipPlan) {
          member.membershipPlan = null;
          member.membershipStartDate = null;
          member.membershipEndDate = null;
        }
      }

      if (assignedTrainer !== undefined) {
        member.assignedTrainer = assignedTrainer || null;
      }

      if (status !== undefined) member.status = status;
      if (notes !== undefined) member.notes = notes;
    }

    await member.save();

    const updatedMember = await Member.findById(member._id)
      .populate('user', 'name email role')
      .populate('membershipPlan', 'name price duration')
      .populate({
        path: 'assignedTrainer',
        populate: { path: 'user', select: 'name email' },
      });

    return successResponse(res, 'Member profile updated successfully.', {
      member: updatedMember,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete member
 * @route   DELETE /api/members/:id
 * @access  Private (Admin only)
 */
const deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return errorResponse(res, 'Member not found.', null, 404);
    }

    const userId = member.user;
    await Member.findByIdAndDelete(member._id);
    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    return successResponse(res, 'Member and associated user account deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMembers,
  getMemberById,
  getMemberProfile,
  createMember,
  updateMember,
  deleteMember,
};
