import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';

const isLogin = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        // console.log(token);

        if(!token) return res.status(500).send({ success: false, message: 'User unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) return res.status(500).send({ success: false, message: 'User unauthorized - Invalid Token' });

        const user = await User.findById(decoded.userId).select('-password');

    
        if(!user) return res.status(500).send({ success: false, message: 'User not found' });

        req.user = user;
        next();
    } catch(err) {
         console.log(`error in isLogin middleware ${err.message}`);
         res.status(500).send({
            success: false,
            message: err
         });
    }
}

export default isLogin;