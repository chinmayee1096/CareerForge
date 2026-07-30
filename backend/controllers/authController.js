import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import generateToken from "../utils/generateToken.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "student", department, semester } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(409);
      throw new Error("Email is already registered.");
    }

    const user = await User.create({ name, email, password, role });
    if (role === "student") {
      await StudentProfile.create({ userId: user._id, department, semester });
    }

    res.status(201).json({
      success: true,
      data: { user: { id: user._id, name, email, role, profilePhoto: user.profilePhoto || "" }, token: generateToken(user) }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid email or password.");
    }

    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePhoto: user.profilePhoto || "" },
        token: generateToken(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({ success: true, data: req.user });
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.email !== undefined) user.email = req.body.email;
    if (req.body.profilePhoto !== undefined) user.profilePhoto = req.body.profilePhoto;

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || ""
      }
    });
  } catch (error) {
    next(error);
  }
};
