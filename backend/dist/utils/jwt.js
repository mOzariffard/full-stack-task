"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("./errors");
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.expiresIn,
    });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.UnauthorizedError('Token expired');
        }
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_1.UnauthorizedError('Invalid token');
        }
        throw new errors_1.UnauthorizedError('Authentication failed');
    }
}
//# sourceMappingURL=jwt.js.map