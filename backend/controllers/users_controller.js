import User from "../models/userSchema.js";
import bcryptjs from "bcryptjs";
import jwtToken from "../utils/jsonwebtoken.js";

const userResponse = (user, message) => ({
  success: true, message, _id: user.id, fullname: user.fullname,
  username: user.username, profilePic: user.profilePic, email: user.email,
});

export const userRegister = async (req, res) => {
  try {
    const { fullname, username, email, gender, password, profilePic } = req.body;
    if (![fullname, username, email, gender, password].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({ success: false, message: "Full name, username, email, gender, and password are required" });
    }
    if (!["male", "female"].includes(gender)) return res.status(400).json({ success: false, message: "Gender must be male or female" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
    if (existingUser) return res.status(409).json({ success: false, message: "Username or email already exists" });

    const hashedPassword = await bcryptjs.hash(password, 12);
    const avatar = profilePic?.trim() || `https://avatar.iran.liara.run/public/${gender === "male" ? "boy" : "girl"}?username=${encodeURIComponent(normalizedUsername)}`;
    const newUser = await User.create({ fullname: fullname.trim(), username: normalizedUsername, email: normalizedEmail, gender, password: hashedPassword, profilePic: avatar });
    jwtToken(newUser._id, res);
    return res.status(201).json(userResponse(newUser, "User registered successfully"));
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "Username or email already exists" });
    console.error("Registration error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to register user" });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcryptjs.compare(password, user.password))) return res.status(401).json({ success: false, message: "Email or password is incorrect" });
    jwtToken(user._id, res);
    return res.status(200).json(userResponse(user, "User logged in successfully"));
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to log in" });
  }
};

export const userLogout = (req, res) => {
  res.clearCookie("jwt", { httpOnly: true, sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict", secure: process.env.NODE_ENV === "production" });
  return res.status(200).json({ success: true, message: "User logged out successfully" });
};

