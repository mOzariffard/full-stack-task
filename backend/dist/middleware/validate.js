"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const errors_1 = require("../utils/errors");
function validate(schema, target = 'body') {
    return (req, _res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const formatted = formatZodErrors(result.error);
            next(new errors_1.ValidationError(formatted));
            return;
        }
        // Replace request data with parsed (coerced) values
        req[target] = result.data;
        next();
    };
}
function formatZodErrors(error) {
    return error.issues
        .map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
    })
        .join('; ');
}
//# sourceMappingURL=validate.js.map