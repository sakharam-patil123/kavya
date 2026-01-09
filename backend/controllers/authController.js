const User = require('../models/userModel');
const Institution = require('../models/institutionModel');
const Notification = require('../models/notificationModel');
const jwt = require('jsonwebtoken');
const Schedule = require('../models/scheduleModel');
const Event = require('../models/eventModel');
const sendgrid = require('@sendgrid/mail');

// Simple forgot/reset password helpers (minimal, dev-friendly)
// Generates a short-lived token (1 hour) that encodes the user id.
const createResetToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: '1h' });
};

// @desc    Forgot password - generate reset link (dev-friendly)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal whether the email exists
            return res.status(200).json({ message: 'If that email is registered, a reset link has been generated.' });
        }

        const token = createResetToken(user._id);
        const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontend}/reset-password?token=${token}`;

        // Try to send an email if SendGrid configured, but always return the link for dev convenience
        if (process.env.SENDGRID_API_KEY) {
            try {
                sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
                await sendgrid.send({
                    to: user.email,
                    from: process.env.FROM_EMAIL || 'no-reply@example.com',
                    subject: 'Password reset',
                    text: `Reset your password: ${resetUrl}`
                });
            } catch (e) {
                console.warn('SendGrid send failed:', e && e.message ? e.message : e);
            }
        }

        // Return resetUrl for development/testing. In production, consider not returning this.
        return res.status(200).json({ message: 'Reset link generated', resetUrl });
    } catch (err) {
        console.error('forgotPassword error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        console.log('resetPassword called - token present?', !!token, 'password present?', !!password);
        if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
        } catch (e) {
            console.warn('resetPassword jwt.verify error:', e && e.message ? e.message : e);
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        console.log('resetPassword decoded payload:', decoded);

        const user = await User.findById(decoded.id).select('+password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.password = password;
        await user.save();

        return res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        // If Mongoose validation failed for the new password, return 400 with the validation message
        if (err && err.name === 'ValidationError') {
            console.error('resetPassword validation error:', err.message || err);
            return res.status(400).json({ message: err.message || 'Validation error' });
        }
        console.error('resetPassword error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Generate JWT Token
const generateToken = (userId, userRole) => {
    if (!userRole) {
        console.warn('No role provided for token generation!');
        userRole = 'student';
    }
    console.log('Generating token for:', { userId, userRole });
    const payload = { id: userId, role: userRole };
    console.log('Token payload:', payload);
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
    console.log('Generated token payload:', jwt.decode(token));
    return token;
};// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, password, role, phone, gender, bio, location, address, avatar } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user with provided profile details
        const userRole = role || 'student';
        // Normalize address: registration may send a single string. Convert to object shape.
        let normalizedAddress = undefined;
        if (address) {
            if (typeof address === 'string') {
                normalizedAddress = { street: address };
            } else if (typeof address === 'object') {
                normalizedAddress = address;
            }
        }

        const userData = {
            fullName,
            email,
            password,
            role: userRole,
            phone: phone || undefined,
            gender: gender || undefined,
            bio: bio || undefined,
            location: location || undefined,
            address: normalizedAddress,
            avatar: avatar || undefined,
        };

        const user = await User.create(userData);

        if (user) {
            // Send welcome email
            if (process.env.SENDGRID_API_KEY) {
                sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
                await sendgrid.send({
                    to: email,
                    from: process.env.FROM_EMAIL,
                    subject: 'Welcome to KavyaLearn',
                    text: `Welcome to KavyaLearn, ${fullName}!`,
                    html: `<h1>Welcome to KavyaLearn</h1><p>Dear ${fullName},</p><p>Thank you for joining KavyaLearn. We're excited to have you on board!</p>`
                });
            }

            const token = generateToken(user._id, userRole);

            res.status(201).json({
                message: 'Account successfully created',
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    phone: user.phone || null,
                    gender: user.gender || null,
                    bio: user.bio || null,
                    location: user.location || null,
                    address: user.address || null,
                    avatar: user.avatar || null,
                    token: token,
                },
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email }).select('+password +role');

        // Check if user exists and password matches
        if (user && (await user.matchPassword(password))) {
            // Check if this is first login
            const isFirstLogin = user.firstLogin;
            
            // Update last login
            user.lastLogin = Date.now();
            
            // Mark first login as completed
            if (user.firstLogin) {
                user.firstLogin = false;
            }
            
            // Set role if not already set
            if (!user.role) {
                user.role = 'student';
            }
            
            await user.save();

            // Use the generateToken function for consistency
            const token = generateToken(user._id, user.role);

            // Get unread notification count for this user
            const unreadCount = await Notification.countDocuments({
                userId: user._id,
                unread: true,
            });

            // Ensure the user has a schedule; if not, initialize with value 0
            let schedule = await Schedule.findOne({ userId: user._id });
            if (!schedule) {
                schedule = new Schedule({ userId: user._id, value: 0, entries: [] });
                await schedule.save();
            }

            // Compute upcoming classes count for the logged-in user
            const now = new Date();
            const upcomingCount = await Event.countDocuments({
                enrolledStudents: user._id,
                date: { $gte: now },
                status: 'Scheduled',
            });

            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone || null,
                gender: user.gender || null,
                avatar: user.avatar || null,
                bio: user.bio || null,
                location: user.location || null,
                address: user.address || null,
                role: user.role,
                token: token,
                isFirstLogin: isFirstLogin,
                notificationCount: unreadCount,
                schedule: {
                    value: schedule.value,
                    entries: schedule.entries || [],
                },
                upcomingClassesCount: upcomingCount || 0,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password');

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.fullName = req.body.fullName || user.fullName;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            user.avatar = req.body.avatar || user.avatar;
            user.gender = req.body.gender || user.gender;
            user.bio = req.body.bio || user.bio;
            user.location = req.body.location || user.location;
            
            if (req.body.address) {
                user.address = {
                    ...user.address,
                    ...req.body.address
                };
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone || null,
                gender: updatedUser.gender || null,
                bio: updatedUser.bio || null,
                location: updatedUser.location || null,
                address: updatedUser.address || null,
                avatar: updatedUser.avatar || null,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};