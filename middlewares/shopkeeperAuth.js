import jwt from "jsonwebtoken";

export const shopkeeperMiddleware = (req, res, next) => {
    try {
        let authHeader = req.headers.authorization || req.headers['Authorization'];
        if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
            authHeader = authHeader.slice(7).trim();
        }

        if (!authHeader) {
            return res.status(401).json({ message: "Token missing" });
        }

        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);

        // MUST match payload
        req.shopkeeperid = decoded.shopkeeperid;

        if (!req.shopkeeperid) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        next();
    } catch (err) {
        console.error("JWT VERIFY ERROR:", err.message);
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};