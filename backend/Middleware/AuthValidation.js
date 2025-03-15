import Joi from 'joi';

export const validateSignup = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required().min(2),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(6)
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: error.details[0].message,
            success: false
        });
    }
    next();
};

export const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: error.details[0].message,
            success: false
        });
    }
    next();
};
