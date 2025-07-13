import { matchedData, validationResult } from "express-validator"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config();

export const validationMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).send({ success: false, errors })

    req.data = matchedData(req);
    next();
}

export const createAccessToken = (id) => {
    return jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "3d" })
}

export const verifyAccessToken = (req, res, next) => {
    const extractingAuthFromHeader = req.headers.authorization
    if (!extractingAuthFromHeader)
        return res.status(401).send({ success: false, msg: "Unauthorized Access" })

    const token = extractingAuthFromHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send({ success: false, msg: "Invalid token" })
        req.user = user;
        next();
    })
}

export const forgotPassToken = (id) => {
    return jwt.sign({ forgotPassId: id }, process.env.FORGOT_PASSWORD_SECRET, { expiresIn: "10m" })
}

export const verifyPasswordResetToken = (req, res, next) => {
    const headersContainingToken = req.headers.authorization
    if (!headersContainingToken)
        return res.status(401).send({ success: false , msg: "Password reset token is needed to proceed" })

    const passwordResetToken = headersContainingToken.split(" ")[1];
    jwt.verify(passwordResetToken, process.env.FORGOT_PASSWORD_SECRET, (err, decoded) => {
        if (err) return res.status(403).send({ success: false, msg: "Invalid reset token. OTP has likely expired" })
        
        req.forgotPassId = decoded.forgotPassId
        next();
    })
}



export const userCreationSchema = {
    firstName: {
        notEmpty: {
            errorMessage: "A firstname must be provided"
        },
        isString: {
            errorMessage: "Firstname must be a string"
        },
        isLength: {
            options: { min: 3 },
            errorMessage: "Firstname must be at least 3 characters"
        }
    },
    lastName: {
        notEmpty: {
            errorMessage: "A lastname must be provided"
        },
        isString: {
            errorMessage: "Lastname must be a string"
        },
        isLength: {
            options: { min: 3 },
            errorMessage: "Lastname must be at least 3 characters"
        }
    },
    email: {
        notEmpty: {
            errorMessage: "An email address must be provided"
        },
        isEmail: {
            errorMessage: "Invalid email address"
        }
    },
    password: {
        notEmpty: {
            errorMessage: "A password must be provided"
        },
        isString: {
            errorMessage: "Password must be a string"
        },
        isLength: {
            options: { min: 3 },
            errorMessage: "Password must be at least 5 characters"
        }
    },
}

export const loginSchema = {
    email: {
        notEmpty: {
            errorMessage: "An email address must be provided"
        },
        isEmail: {
            errorMessage: "Invalid email address"
        }
    },
    password: {
        notEmpty: {
            errorMessage: "A password must be provided"
        },
        isString: {
            errorMessage: "Password must be a string"
        },
        isLength: {
            options: { min: 3 },
            errorMessage: "Password must be at least 5 characters"
        }
    },
}