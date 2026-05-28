import {prisma} from '../config/prismaConfig.js'
import jwt from 'jsonwebtoken'

export const customerMiddleware = async (req, res, next) => {
    try {
        let token = req.headers['authorization'] || req.headers.authorization;
        if (token && typeof token === 'string' && token.toLowerCase().startsWith('bearer ')) {
            token = token.slice(7).trim();
        }
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if(!decoded.customerid){
                return res.status(401).json({ success: false, message: "Customer not found" });
            }
            const customer = await prisma.customer.findUnique({
                where: { id: decoded.customerid }
            });
            if (customer) {
                req.customerid = decoded.customerid;
                next();
            } else {
                return res.status(401).json({ success: false, message: "Customer not found" });
            }
        } else {
            return res.status(401).json({ success: false, message: "Token not provided" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};