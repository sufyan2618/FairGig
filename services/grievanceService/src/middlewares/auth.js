import jwt from "jsonwebtoken";

import { ALLOWED_ROLES } from "../config/constants.js";
import { env } from "../config/env.js";
import { raise } from "../utils/httpError.js";

export const requireAuth = () => (req, _res, next) => {
    const authorization = req.header("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
        raise(401, "UNAUTHORIZED", "Missing or invalid Bearer token.");
    }

    const token = authorization.slice(7).trim();
    if (!token) {
        raise(401, "UNAUTHORIZED", "Missing Bearer token value.");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, env.jwtSecret);
    } catch (_error) {
        raise(401, "UNAUTHORIZED", "Invalid or expired token.");
    }

    const userId = decoded.sub ?? decoded.user_id ?? decoded.id;
    const role = decoded.role;

    if (!userId || typeof userId !== "string") {
        raise(401, "UNAUTHORIZED", "Token subject is missing.");
    }

    if (!role || typeof role !== "string" || !ALLOWED_ROLES.includes(role)) {
        raise(403, "FORBIDDEN", "Token role is invalid.");
    }

    if (decoded.type && decoded.type !== "access") {
        raise(401, "UNAUTHORIZED", "Only access tokens are allowed.");
    }

    req.auth = {
        userId,
        role,
    };

    return next();
};

export const requireRoles = (...allowedRoles) => (req, _res, next) => {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
        raise(403, "FORBIDDEN", "You are not allowed to perform this action.");
    }
    return next();
};