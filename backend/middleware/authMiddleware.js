import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401);
      throw new Error("Not authorized, token missing.");
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error("Not authorized, user unavailable.");
    }

    req.user = user;
    const lastActive = user.lastActiveAt?.getTime?.() || 0;
    if (Date.now() - lastActive > 5 * 60 * 1000) {
      User.updateOne({ _id: user._id }, { lastActiveAt: new Date() }).catch(() => {});
    }
    next();
  } catch (error) {
    next(error);
  }
};
