exports.createPostValidator = (req, res, next) => {
    req.check('title', 'Escreva um título').notEmpty();
    req.check('title', 'Título deve ter entre 4 e 150 letras').isLength({
        min: 4, max: 150
    });

    req.check('body', 'Escreva uma descrição').notEmpty();
    req.check('body', 'Descrição deve ter entre 4 e 150 letras').isLength({
        min: 4, max: 2000
    });

    const errors = req.validationErrors();
    if(errors) {
        const firstError = errors.map((error) => error.msg)[0];
        return res.status(400).json({error: firstError});
    }
    next();
};

exports.signupValidator =  (req, res, next) => {
    req.check('name', 'O nome é obrigatório').notEmpty();
    req.check('email', 'O email é obrigatório').notEmpty();
    req.check('email', 'O formato de email está inválido')
        .matches(/.+\@.+\..+/)
        .withMessage('Email deve contem um @')
        .isLength({
            min: 4,
            max: 2000
        });
    req.check('password', 'A senha é obrigatório').notEmpty();
    req.check('password')
        .isLength({ min: 6 })
        .withMessage('A senha deve conter pelo menos 6 digitos');

    const errors = req.validationErrors();
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({ error: firstError });
    }
    next();
};

exports.signinValidator = (request, response, next) => {
    request
        .check('email', 'O email deve conter entre 3 e 32 caracteres')
        .matches(
            /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
        )
        .withMessage('Entre com um email válido')
        .isLength({
            min: 4,
            max: 32
        });
    request.check('password', 'A senha é obrigatória!').notEmpty();
    request
        .check('password')
        .isLength({ min: 6 })
        .withMessage('A senha deve ter no mínimo 6 caracteres');
    const errors = request.validationErrors();
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return response.status(400).json({ error: firstError });
    }
    next();
};

exports.passwordResetValidator = (req, res, next) => {
    req.check('newPassword', 'Password is required').notEmpty();
    req.check('newPassword')
        .isLength({ min: 6 })
        .withMessage('A senha deve ter no mínimo 6 caracteres')
        .withMessage('must contain a number')
        .withMessage('Password must contain a number');
    const errors = req.validationErrors();
    if (errors) {
        const firstError = errors.map(error => error.msg)[0];
        return res.status(400).json({ error: firstError });
    }
    next();
};