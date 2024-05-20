import postgres from "postgres";
import Router from "../router/Router";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import User, { DuplicateEmailError } from "../models/User";
import Cookie from "../auth/Cookie";

export default class UserController {
    private sql: postgres.Sql<any>;

    constructor(sql: postgres.Sql<any>) {
        this.sql = sql;
    }

    registerRoutes(router: Router) {
        router.get("/register", this.getRegistrationForm);
        router.get("/login", this.getLoginForm);
        router.post("/register", this.createUser);
        router.post("/login", this.login);
        router.get("/logout", this.logout);
    }

    getRegistrationForm = async (req: Request, res: Response) => {
        const errorType = req.getSearchParams().get('error');

        let errorMessage = '';

        switch (errorType) {
            case 'email':
                errorMessage = 'Email is required.';
                break;
            case 'username':
                errorMessage = 'Username is required.';
                break;
            case 'password':
                errorMessage = 'Password is required.';
                break;
            case 'confirm_password':
                errorMessage = 'Confirming password is required.';
                break;
            case 'password_mismatch':
                errorMessage = 'Passwords do not match.';
                break;
            case 'unexpected_error':
                errorMessage = 'Unexpected error occurred.';
                break;
            case 'email_exists':
                errorMessage = 'An account with this email already exists.';
                break;
        }

        res.send({
            statusCode: StatusCode.OK,
            message: 'Registration form rendered successfully!',
            template: 'RegisterView',
            payload: { error: errorMessage }
        });
    };

    getLoginForm = async (req: Request, res: Response) => {
        const errorType = req.getSearchParams().get('error');
        const isLoggedIn = req.session.get('isLoggedIn') || false;
        let errorMessage = '';
        let successMessage = '';

        if (errorType === 'invalid_credentials') {
            errorMessage = 'Invalid credentials.';
        }

        const rememberedEmailCookie = req.findCookie('remember_email');
        const rememberedEmail = rememberedEmailCookie ? rememberedEmailCookie.value : '';
        const rememberMeChecked = rememberedEmail !== '';

        const successType = req.getSearchParams().get('success');
        if (successType) {
            successMessage = 'User created';
        }

        res.send({
            statusCode: StatusCode.OK,
            message: 'Displaying login form',
            payload: {
                error: errorMessage,
                success: successMessage,
                isLoggedIn: isLoggedIn,
                rememberedEmail: rememberedEmail,
                rememberMeChecked: rememberMeChecked
            },
            template: 'LoginView',
        });
    };

    createUser = async (req: Request, res: Response) => {
        try {
            const { email, username, password, confirmPassword } = req.body;

            // Validate email
            if (!email) {
                res.send({
                    statusCode: StatusCode.BadRequest,
                    message: "Email is required.",
                    redirect: '/register?error=email'
                });
                return;
            }

            // Validate username
            if (!username) {
                res.send({
                    statusCode: StatusCode.BadRequest,
                    message: "Username is required.",
                    redirect: '/register?error=username'
                });
                return;
            }

            // Validate password
            if (!password) {
                res.send({
                    statusCode: StatusCode.BadRequest,
                    message: "Password is required.",
                    redirect: '/register?error=password'
                });
                return;
            }

            // Validate confirm password
            if (!confirmPassword) {
                res.send({
                    statusCode: StatusCode.BadRequest,
                    message: "Confirm password is required.",
                    redirect: '/register?error=confirm_password'
                });
                return;
            }

            // Validate that the passwords match
            if (password !== confirmPassword) {
                res.send({
                    statusCode: StatusCode.BadRequest,
                    message: "Passwords do not match.",
                    redirect: '/register?error=password_mismatch'
                });
                return;
            }

            // Attempting to create a new user now
            const newUser = await User.create(this.sql, { email, username, password, createdAt: new Date() });

            // If user is created successfully, redirect to login with a success message
            res.send({
                statusCode: StatusCode.Created,
                message: "User created",
                payload: { user: newUser.props },
                redirect: '/login?success=register'
            });

        } catch (error) {
            if (error instanceof DuplicateEmailError) {
                res.send({
                    statusCode: StatusCode.BadRequest,
                    message: "User with this email already exists.",
                    redirect: '/register?error=email_exists'
                });
            } else {
                console.error('Registration error:', error);
                res.send({
                    statusCode: StatusCode.InternalServerError,
                    message: "Unexpected error during registration",
                    redirect: '/register?error=unexpected_error'
                });
            }
        }
    };

    login = async (req: Request, res: Response) => {
        const { email, password, rememberMe } = req.body;

        try {
            const user = await User.login(this.sql, email, password);
            req.session.set('userId', user.props.id);
            req.session.set('isLoggedIn', true);
            req.session.set('userName', user.props.username);
            const sessionCookie = new Cookie('session_id', req.session.id);
            res.setCookie(sessionCookie);

            if (rememberMe === "on") {
                const rememberCookie = new Cookie('remember_email', email, 1000 * 60 * 60 * 24 * 30);
                res.setCookie(rememberCookie);
            } else {
                const rememberCookie = new Cookie('remember_email', '', 0);
                res.setCookie(rememberCookie);
            }

            res.send({
                statusCode: StatusCode.Redirect,
                message: 'Logged in successfully!',
                redirect: '/'
            });
        } catch (error) {
            req.session.set('isLoggedIn', false);
            res.send({
                statusCode: StatusCode.BadRequest,
                message: 'Invalid credentials.',
                payload: { error: 'Invalid credentials.', isLoggedIn: false },
                template: 'LoginView',
            });
        }
    };

    logout = async (req: Request, res: Response) => {
        req.session.destroy();
        const sessionCookie = new Cookie('session_id', "", 0);
        res.setCookie(sessionCookie);

        res.send({
            statusCode: StatusCode.Redirect,
            message: 'You have been logged out successfully',
            payload: { isLoggedIn: false },
            redirect: '/'
        });
    };
}