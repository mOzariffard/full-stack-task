"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
exports.AuthController = {
    async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    },
    async login(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            res.status(200).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    },
    async profile(req, res, next) {
        try {
            const userId = req.user.userId;
            const user = await auth_service_1.AuthService.getProfile(userId);
            res.status(200).json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=auth.controller.js.map