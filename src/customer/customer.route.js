import { Router } from "express"
import { customerInventoryRouter } from './inventory.js'
import { customerOrdersRouter } from "./orders.js"; // import customerOrdersRouter
// import necessary routes
import { authRouter } from "./auth.js";
import { addressRouter } from "./address.js";
import { customerCartRouter } from "./cart.js";
import { wishlistRouter } from "./wishlist.js";
import { customerReviewsRouter } from "./reviews.js";

export const customerRouter = Router();

customerRouter.use('/auth', authRouter)
customerRouter.use('/address', addressRouter)
customerRouter.use('/cart', customerCartRouter)
customerRouter.use('/wishlist', wishlistRouter)
customerRouter.use('/reviews', customerReviewsRouter)
customerRouter.use('/inventory', customerInventoryRouter)
customerRouter.use('/orders', customerOrdersRouter) // use customerOrdersRouter



