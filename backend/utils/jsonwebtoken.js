import jwt from 'jsonwebtoken';


const jwtToken = (userId, res) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn:'30d'
    });

    res.cookie('jwt', token, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
        secure: process.env.NODE_ENV === "production"
    });
}

export default jwtToken;

