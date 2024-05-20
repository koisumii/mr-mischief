import postgres from "postgres";
import Router from "../router/Router";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import Feedback from "../models/Feedback";

export default class FeedbackController {
    private sql: postgres.Sql<any>;

    constructor(sql: postgres.Sql<any>) {
        this.sql = sql;
    }

    registerRoutes(router: Router) {
        router.get("/feedback", this.getFeedbackView);
        router.post("/feedback/submit", this.submitFeedback);
        router.get("/feedback/:id/edit", this.getFeedbackForEdit); 
        router.post("/feedback/:id/edit", this.updateFeedback); 
        router.post("/feedback/:id/delete", this.deleteFeedback); 
    }

    getFeedbackView = async (req: Request, res: Response) => {
        const isLoggedIn = req.session.get('isLoggedIn') || false;
        const userId = req.session.get('userId');

        let feedbacks: Feedback[] = [];
        let allFeedbacks: Feedback[] = [];

        try {
            allFeedbacks = await Feedback.readAll(this.sql);
            if (isLoggedIn && userId) {
                feedbacks = await Feedback.readByUser(this.sql, userId);
            }
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
        }

        res.send({
            statusCode: StatusCode.OK,
            message: "Feedback view rendered successfully",
            template: 'FeedbackView',
            payload: {
                isLoggedIn,
                userId, 
                feedbacks: feedbacks.map(fb => ({ ...fb.props, isOwner: fb.props.userId === userId })),
                allFeedbacks: allFeedbacks.map(fb => fb.props)
            }
        });
    };

    submitFeedback = async (req: Request, res: Response) => {
        const userId = req.session.get('userId');
        const { feedback } = req.body;

        if (!userId) {
            res.send({
                statusCode: StatusCode.Unauthorized,
                message: "You must be logged in to submit feedback.",
                redirect: '/login'
            });
            return;
        }

        try {
            await Feedback.create(this.sql, { content: feedback, userId, createdAt: new Date() });
            res.send({
                statusCode: StatusCode.Created,
                message: "Feedback submitted successfully!",
                redirect: '/feedback'
            });
        } catch (error) {
            console.error("Error submitting feedback:", error);
            res.send({
                statusCode: StatusCode.InternalServerError,
                message: "Error submitting feedback.",
                redirect: '/feedback'
            });
        }
    };

    getFeedbackForEdit = async (req: Request, res: Response) => {
        const feedbackId = req.getId(); 
        const userId = req.session.get('userId');
        const isLoggedIn = req.session.get('isLoggedIn') || false;

        if (!userId) {
            res.send({
                statusCode: StatusCode.Unauthorized,
                message: "You must be logged in to edit feedback.",
                redirect: '/login'
            });
            return;
        }

        try {
            const feedbackItem = await Feedback.read(this.sql, feedbackId);
            if (feedbackItem && feedbackItem.props.userId === userId) {
                res.send({
                    statusCode: StatusCode.OK,
                    message: "Edit feedback form",
                    template: 'EditFeedbackView', 
                    payload: {
                        isLoggedIn,
                        feedback: feedbackItem.props
                    }
                });
            } else {
                res.send({
                    statusCode: StatusCode.Forbidden,
                    message: "You do not have permission to edit this feedback.",
                    redirect: '/feedback'
                });
            }
        } catch (error) {
            console.error("Error fetching feedback for edit:", error);
            res.send({
                statusCode: StatusCode.InternalServerError,
                message: "Error fetching feedback for edit.",
                redirect: '/feedback'
            });
        }
    };


    updateFeedback = async (req: Request, res: Response) => {
        console.log("updateFeedback method called");
        const userId = req.session.get('userId');
        const { feedback } = req.body;
        const feedbackId = req.getId(); 

        if (!userId) {
            res.send({
                statusCode: StatusCode.Unauthorized,
                message: "You must be logged in to update feedback.",
                redirect: '/login'
            });
            return;
        }

        try {
            const feedbackItem = await Feedback.read(this.sql, feedbackId);
            if (feedbackItem && feedbackItem.props.userId === userId) {
                console.log("Updating feedback:", feedbackItem);
                await feedbackItem.update({ content: feedback, editedAt: new Date() });
                console.log("Feedback updated successfully");
                res.send({
                    statusCode: StatusCode.OK,
                    message: "Feedback updated successfully!",
                    redirect: '/feedback'
                });
            } else {
                res.send({
                    statusCode: StatusCode.Forbidden,
                    message: "You do not have permission to update this feedback.",
                    redirect: '/feedback'
                });
            }
        } catch (error) {
            console.error("Error updating feedback:", error);
            res.send({
                statusCode: StatusCode.InternalServerError,
                message: "Error updating feedback.",
                redirect: '/feedback'
            });
        }
    };

    deleteFeedback = async (req: Request, res: Response) => {
        console.log("deleteFeedback method called");
        const userId = req.session.get('userId');
        const feedbackId = req.getId(); 

        if (!userId) {
            res.send({
                statusCode: StatusCode.Unauthorized,
                message: "You must be logged in to delete feedback.",
                redirect: '/login'
            });
            return;
        }

        try {
            const feedbackItem = await Feedback.read(this.sql, feedbackId);
            if (feedbackItem && feedbackItem.props.userId === userId) {
                console.log("Deleting feedback:", feedbackItem);
                await feedbackItem.delete();
                console.log("Feedback deleted successfully");
                res.send({
                    statusCode: StatusCode.OK,
                    message: "Feedback deleted successfully!",
                    redirect: '/feedback'
                });
            } else {
                res.send({
                    statusCode: StatusCode.Forbidden,
                    message: "You do not have permission to delete this feedback.",
                    redirect: '/feedback'
                });
            }
        } catch (error) {
            console.error("Error deleting feedback:", error);
            res.send({
                statusCode: StatusCode.InternalServerError,
                message: "Error deleting feedback.",
                redirect: '/feedback'
            });
        }
    };
}