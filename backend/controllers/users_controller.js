import User from "../models/userSchema.js";
import bcryptjs from 'bcryptjs';
import jwtToken from '../utils/jsonwebtoken.js';

export const userRegister = async (req, res)=> {
    try {
        // console.log(req.body);
        const { fullname, username, email, gender, password, profilePic} = req.body;
        const user = await User.findOne({username, email});
        if(user) {
            return res.status(500).send({
                success: false,
                message: "UserName or Email already exist"
            });
        }

        const hashPassword = bcryptjs.hashSync(password, 10);
        const profileBoy = profilePic || `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const profileGirl = profilePic || `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const newUser = new User({
            fullname, 
            username,
            email,
            password:hashPassword,
            gender,
            profilePic: gender === 'male' ? profileBoy : profileGirl
        })

        if(newUser) {
            await newUser.save();
            jwtToken(newUser._id, res);
        } else {
            res.status(500).send({
                success: false,
                message: "Invalid User Data"
            });
        }
        
        res.status(201).send({
            _id: newUser.id,
            fullname: newUser.fullname,
            username: newUser.username,
            profilePic: newUser.profilePic,
            email: newUser.email,
        });

    } catch(err) {
        res.status(500).send({
            success: false,
            message: err
        });
        console.log(err);
    }
}


export const userLogin = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user) {
            return res.status(500).send({
                success: false,
                message: "Email doesn't Exist. Please Register"
            });
        }

        const comparePass = bcryptjs.compareSync(password, user.password || "");
        if(!comparePass) {
            return res.status(500).send({
                success: false,
                message: "Email or Password doesn't match"
            });
        }

        jwtToken(user._id, res);

        res.status(200).send({
            _id: user.id,
            fullname: user.fullname,
            username: user.username,
            profilePic: user.profilePic,
            email: user.email,
            message: 'Successfully Login'
        })

    } catch(err) {
        res.status(500).send({
            success: false,
            message: err
        });
        console.log(err);
    }
}

export const userLogout = async (req, res) => {
    try {
        res.cookie("jwt", '', {
            maxAge: 0
        });

        res.status(200).send({
            message: 'User Logout'
        });
    } catch(err) {
        res.status(500).send({
            success: false,
            message: err
        });
        console.log(err);
    }
};