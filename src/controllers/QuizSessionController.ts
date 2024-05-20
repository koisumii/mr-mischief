import Router from "../router/Router";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import { quizQuestions } from "../models/QuizQuestions";

export default class QuizSessionController {
    registerRoutes(router: Router) {
        router.get("/start", this.startQuiz);
        router.get("/quiz", this.getNextQuestion);
        router.get("/quiz/next", this.loadNextQuestion);
        router.get("/quiz/end", this.endQuiz);
        router.post("/quiz", this.submitAnswer);
    }

    startQuiz = async (req: Request, res: Response) => {
        const userId = req.session.get('userId');
        const isLoggedIn = req.session.get('isLoggedIn') || false;

        if (!userId) {
            await res.send({
                statusCode: StatusCode.Redirect,
                message: "Please log in to start the quiz.",
                redirect: '/login'
            });
            return;
        }

        req.session.set('currentQuestionIndex', 0);
        req.session.set('score', 0);
        req.session.set('feedback', null);
        req.session.set('expression', null);
        req.session.set('isCorrect', null);

        res.send({
            statusCode: StatusCode.Redirect,
            message: 'Quiz started!',
            redirect: "/quiz"
        });
    };

    getNextQuestion = async (req: Request, res: Response) => {
        const userId = req.session.get('userId');
        const isLoggedIn = req.session.get('isLoggedIn') || false;

        if (!userId) {
            await res.send({
                statusCode: StatusCode.Redirect,
                message: "Please log in to access the quiz.",
                redirect: '/login'
            });
            return;
        }

        const currentQuestionIndex = req.session.get('currentQuestionIndex') || 0;
        const score = req.session.get('score') || 0;

        if (currentQuestionIndex >= quizQuestions.length) {
            res.send({
                statusCode: StatusCode.Redirect,
                message: 'Quiz completed!',
                redirect: '/quiz/end'
            });
            return;
        }

        const question = quizQuestions[currentQuestionIndex];
        const feedback = req.session.get('feedback');
        const expression = req.session.get('expression');
        const isCorrect = req.session.get('isCorrect');

        res.send({
            statusCode: StatusCode.OK,
            message: 'Next question loaded successfully!',
            template: 'QuizView',
            payload: {
                question,
                currentQuestionIndex: currentQuestionIndex + 1,
                totalQuestions: quizQuestions.length,
                score,
                isLoggedIn,
                feedback,
                expression,
                isCorrect,
                quizmasterExpression: expression || "/mischief-expressions/welp.webp",
                quizmasterDialogue: feedback || ""
            }
        });

        req.session.set('feedback', null);
        req.session.set('isCorrect', null);
    };

    loadNextQuestion = async (req: Request, res: Response) => {
        const userId = req.session.get('userId');
        const isLoggedIn = req.session.get('isLoggedIn') || false;

        if (!userId) {
            await res.send({
                statusCode: StatusCode.Redirect,
                message: "Please log in to access the quiz.",
                redirect: '/login'
            });
            return;
        }

        let currentQuestionIndex = req.session.get('currentQuestionIndex') || 0;
        currentQuestionIndex += 1;
        req.session.set('currentQuestionIndex', currentQuestionIndex);

        const score = req.session.get('score') || 0;

        if (currentQuestionIndex >= quizQuestions.length) {
            res.send({
                statusCode: StatusCode.Redirect,
                message: 'Quiz completed!',
                redirect: '/quiz/end'
            });
            return;
        }

        const question = quizQuestions[currentQuestionIndex];
        const expression = "/mischief-expressions/welp.webp"; // Default expression

        res.send({
            statusCode: StatusCode.OK,
            message: 'Next question loaded successfully!',
            payload: {
                question,
                currentQuestionIndex: currentQuestionIndex + 1,
                totalQuestions: quizQuestions.length,
                score,
                isLoggedIn,
                quizmasterExpression: expression
            }
        });

        req.session.set('feedback', null);
        req.session.set('isCorrect', null);
    };

    submitAnswer = async (req: Request, res: Response) => {
        const userId = req.session.get('userId');
        const isLoggedIn = req.session.get('isLoggedIn') || false;

        if (!userId) {
            await res.send({
                statusCode: StatusCode.Redirect,
                message: "Please log in to submit answers.",
                redirect: '/login'
            });
            return;
        }

        const { answer } = req.body;
        const currentQuestionIndex = req.session.get('currentQuestionIndex') || 0;
        let score = req.session.get('score') || 0;
        const question = quizQuestions[currentQuestionIndex];

        let feedback;
        let isCorrect = false;
        let expression;

        const answerIndex = parseInt(answer);

        if (answerIndex === question.correctAnswer) {
            score += 1;
            req.session.set('score', score);
            feedback = question.correctFeedback;
            isCorrect = true;
            expression = question.correctExpression;
        } else {
            if (question.incorrectFeedbacks) {
                // For multiple incorrect feedbacks, adjust index to skip the correct answer
                let feedbackIndex = answerIndex;
                if (answerIndex > question.correctAnswer) {
                    feedbackIndex -= 1;
                }

                if (Array.isArray(question.incorrectFeedbacks) && feedbackIndex >= 0 && feedbackIndex < question.incorrectFeedbacks.length) {
                    feedback = question.incorrectFeedbacks[feedbackIndex];
                } else {
                    feedback = question.incorrectFeedback;
                }
            } else {
                // For single incorrect feedback
                feedback = question.incorrectFeedback;
            }
            expression = question.incorrectExpression;
        }

        req.session.set('isCorrect', isCorrect);
        req.session.set('feedback', feedback);
        req.session.set('expression', expression);

        res.send({
            statusCode: StatusCode.OK,
            message: 'Answer submitted and feedback provided!',
            payload: {
                isCorrect,
                feedback,
                correctAnswer: question.correctAnswer,
                score: score,
                quizmasterExpression: expression
            }
        });
    };

    endQuiz = async (req: Request, res: Response) => {
        const userId = req.session.get('userId');
        const isLoggedIn = req.session.get('isLoggedIn') || false;

        if (!userId) {
            await res.send({
                statusCode: StatusCode.Redirect,
                message: "Please log in to end the quiz.",
                redirect: '/login'
            });
            return;
        }

        const score = req.session.get('score') || 0;
        const highScore = req.session.get('highScore') || 0;

        res.send({
            statusCode: StatusCode.OK,
            message: 'Quiz completed!',
            template: 'EndView',
            payload: { score, highScore, isLoggedIn }
        });
    };
}
