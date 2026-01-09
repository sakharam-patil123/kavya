const User = require('../models/userModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');
const Achievement = require('../models/achievementModel');
const Lesson = require('../models/lessonModel');

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
// @access  Private/Student
exports.getStudentDashboard = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses.course',
        select: 'title thumbnail instructor level',
        populate: { path: 'instructor', select: 'fullName' }
      })
      .populate('achievements');

    // Filter out null course references (deleted courses)
    const validEnrollments = student.enrolledCourses.filter(c => c.course !== null);
    const enrolledCount = validEnrollments.length;
    const completedCount = validEnrollments.filter(c => c.completionPercentage === 100).length;
    const inProgressCount = enrolledCount - completedCount;
    const averageProgress = enrolledCount 
      ? Math.round(validEnrollments.reduce((sum, c) => sum + c.completionPercentage, 0) / enrolledCount)
      : 0;

    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          fullName: student.fullName,
          email: student.email,
          avatar: student.avatar
        },
        overview: {
          totalCoursesEnrolled: enrolledCount,
          completedCourses: completedCount,
          inProgressCourses: inProgressCount,
          totalStudyHours: student.totalHoursLearned || 0,
          averageProgress,
          totalAchievements: student.achievements?.length || 0,
          streakDays: student.streakDays || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's courses
// @route   GET /api/student/courses
// @access  Private/Student
exports.getStudentCourses = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses.course',
        populate: { 
          path: 'instructor lessons',
          select: 'fullName title',
          options: { limit: 1 }
        }
      });

    // Filter out any null course references (courses that were deleted)
    const courses = student.enrolledCourses
      .filter(ec => ec.course !== null)
      .map(ec => ({
        _id: ec.course._id,
        title: ec.course.title,
        thumbnail: ec.course.thumbnail,
        instructor: ec.course.instructor,
        level: ec.course.level,
        completionPercentage: ec.completionPercentage,
        hoursSpent: ec.hoursSpent,
        completedLessons: ec.completedLessons.length,
        totalLessons: ec.course.lessons.length,
        enrollmentDate: ec.enrollmentDate,
        certificateDownloadedAt: ec.certificateDownloadedAt
      }));

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single course details for student
// @route   GET /api/student/courses/:courseId
// @access  Private/Student
exports.getStudentCourse = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);

    // Check if student is enrolled
    const enrollment = student.enrolledCourses.find(ec => 
      ec.course.toString() === req.params.courseId
    );

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    const course = await Course.findById(req.params.courseId)
      .populate('instructor', 'fullName email')
      .populate('lessons');

    res.json({
      success: true,
      data: {
        course,
        enrollment: {
          completionPercentage: enrollment.completionPercentage,
          hoursSpent: enrollment.hoursSpent,
          completedLessons: enrollment.completedLessons,
          enrollmentDate: enrollment.enrollmentDate,
          certificateDownloadedAt: enrollment.certificateDownloadedAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark lesson as complete
// @route   POST /api/student/courses/:courseId/lessons/:lessonId/complete
// @access  Private/Student
exports.completeLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { hoursSpent } = req.body;

    const student = await User.findById(req.user._id);

    const enrollment = student.enrolledCourses.find(ec => 
      ec.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    // Check if lesson already completed
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    // Update hours spent
    if (hoursSpent) {
      enrollment.hoursSpent = (enrollment.hoursSpent || 0) + hoursSpent;
      student.totalHoursLearned = (student.totalHoursLearned || 0) + hoursSpent;
      console.log('⏰ Lesson Complete: Updated hours -', {
        courseHours: enrollment.hoursSpent,
        totalHours: student.totalHoursLearned
      });
    }

    // Get course to calculate completion percentage
    const course = await Course.findById(courseId).populate('lessons');
    const totalLessons = course.lessons.length;
    const completedCount = enrollment.completedLessons.length;
    enrollment.completionPercentage = Math.round((completedCount / totalLessons) * 100);

    // If course completed, create achievement
    if (enrollment.completionPercentage === 100 && !enrollment.certificateDownloadedAt) {
      const achievement = await Achievement.create({
        user: student._id,
        title: `${course.title} Completed`,
        description: `Successfully completed ${course.title}`,
        type: 'Course Completion',
        course: courseId,
        points: 100
      });

      if (!student.achievements.includes(achievement._id)) {
        student.achievements.push(achievement._id);
      }
    }

    await student.save();

    res.json({
      success: true,
      message: 'Lesson marked as complete',
      data: {
        completionPercentage: enrollment.completionPercentage,
        hoursSpent: enrollment.hoursSpent,
        completedLessons: enrollment.completedLessons.length,
        totalLessons
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student achievements
// @route   GET /api/student/achievements
// @access  Private/Student
exports.getStudentAchievements = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .populate({
        path: 'achievements',
        populate: { path: 'course', select: 'title' }
      });

    // Group achievements by type
    const achievements = {
      courseCompletions: student.achievements.filter(a => a.type === 'Course Completion'),
      assessmentScores: student.achievements.filter(a => a.type === 'Assessment Score'),
      participation: student.achievements.filter(a => a.type === 'Participation'),
      special: student.achievements.filter(a => a.type === 'Special')
    };

    res.json({
      success: true,
      count: student.achievements.length,
      data: {
        ...achievements,
        total: {
          all: student.achievements.length,
          courseCompletions: achievements.courseCompletions.length,
          assessmentScores: achievements.assessmentScores.length,
          participation: achievements.participation.length,
          special: achievements.special.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student study hours / activity
// @route   GET /api/student/activity
// @access  Private/Student
exports.getStudentActivity = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses.course',
        select: 'title'
      });

    // Calculate hours per course
    const hoursByCoure = student.enrolledCourses.map(ec => ({
      course: ec.course.title,
      hoursSpent: ec.hoursSpent || 0
    }));

    res.json({
      success: true,
      data: {
        totalHours: student.totalHoursLearned || 0,
        hoursByCourse: hoursByCoure,
        streakDays: student.streakDays || 0,
        lastLoginDate: student.lastLoginDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private/Student
exports.updateStudentProfile = async (req, res) => {
  try {
    const { fullName, phone, bio, avatar, address } = req.body;

    const student = await User.findByIdAndUpdate(
      req.user._id,
      {
        fullName: fullName || undefined,
        phone: phone || undefined,
        bio: bio || undefined,
        avatar: avatar || undefined,
        ...(address && { address })
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: student
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Enroll student in course
// @route   POST /api/student/enroll/:courseId
// @access  Private/Student
exports.enrollCourse = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already enrolled
    if (student.enrolledCourses.some(ec => ec.course.toString() === req.params.courseId)) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    // Add to student's enrolled courses
    student.enrolledCourses.push({
      course: req.params.courseId,
      completedLessons: [],
      hoursSpent: 0,
      completionPercentage: 0
    });

    // Add to course's enrolled students
    if (!course.enrolledStudents.includes(student._id)) {
      course.enrolledStudents.push(student._id);
    }

    await student.save();
    await course.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: student.enrolledCourses[student.enrolledCourses.length - 1]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student profile (full details)
// @route   GET /api/student/profile
// @access  Private/Student
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses.course',
        select: 'title thumbnail'
      })
      .populate('achievements')
      .select('-password');

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all enrolled courses for logged-in student (paid + admin-assigned free)
// @route   GET /api/student/enrolled-courses
// @access  Private/Student
exports.getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Fetch enrollments that are either paid (purchaseStatus==='paid' or have a paymentId)
    // or explicitly marked free by admin (isFree === true)
    const enrollments = await Enrollment.find({
      studentId,
      $or: [ { isFree: true }, { purchaseStatus: 'paid' }, { paymentId: { $ne: null } } ]
    }).populate({ path: 'courseId', populate: { path: 'instructor', select: 'fullName' } });

    const map = {};

    // Include enrollments from Enrollment collection
    enrollments.forEach(e => {
      if (!e.courseId) return;
      const id = e.courseId._id.toString();
      map[id] = {
        _id: e.courseId._id,
        title: e.courseId.title,
        thumbnail: e.courseId.thumbnail,
        instructor: e.courseId.instructor,
        accessType: (e.isFree || e.purchaseStatus === 'free') ? 'Free' : 'Paid',
        progress: {
          completionPercentage: e.progressPercentage || (e.completed ? 100 : 0),
          hoursSpent: e.watchHours || 0
        }
      };
    });

    // Also include entries from User.enrolledCourses (progress stored there)
    const student = await User.findById(studentId).populate({ path: 'enrolledCourses.course', populate: { path: 'instructor', select: 'fullName' } });
    (student.enrolledCourses || []).forEach(ec => {
      if (!ec.course) return;
      const id = ec.course._id.toString();
      if (!map[id]) {
        // If not present in Enrollment collection, assume it's a paid enrollment (student-driven)
        map[id] = {
          _id: ec.course._id,
          title: ec.course.title,
          thumbnail: ec.course.thumbnail,
          instructor: ec.course.instructor,
          accessType: 'Paid',
          progress: {
            completionPercentage: ec.completionPercentage || 0,
            hoursSpent: ec.hoursSpent || 0
          }
        };
      } else {
        // Merge progress details (prefer User progress values)
        map[id].progress = {
          completionPercentage: ec.completionPercentage || map[id].progress.completionPercentage || 0,
          hoursSpent: ec.hoursSpent || map[id].progress.hoursSpent || 0
        };
      }
    });

    const courses = Object.values(map);

    // Friendly empty state
    if (courses.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
