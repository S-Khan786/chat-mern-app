import express from "express";
import { home } from "../controllers/home_controller.js";
import { userLogin, userLogout, userRegister } from "../controllers/users_controller.js";

const router = express.Router();

router.get("/", home);
router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/logout", userLogout);

//console.log('router loaded');

// Export the router
export default router;
