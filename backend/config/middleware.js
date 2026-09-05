import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';

const isLogin = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        // console.log(token);

        if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) return res.status(401).json({ success: false, message: "Invalid authentication token" });

        const user = await User.findById(decoded.userId).select('-password');

    
        if (!user) return res.status(401).json({ success: false, message: "User no longer exists" });

        req.user = user;
        next();
    } catch(err) {
         console.log(`Error in isLogin middleware: ${err.message}`);
         res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    }
}

export default isLogin;

