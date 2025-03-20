import jwt from 'jsonwebtoken';

const AuthMiddleware = (req, res, next) => {
    const token = req.header('Authorization'); // Get token from request headers

    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = verified; // Attach the decoded token data to `req.user`
        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

export default AuthMiddleware;
