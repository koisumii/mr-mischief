import postgres from "postgres";
import Feedback, { FeedbackProps } from "../src/models/Feedback";
import { test, describe, expect, afterEach, afterAll, beforeEach } from "vitest";

describe("Feedback CRUD operations", () => {

    const sql = postgres({
        database: "MischievousQuizDB",
    });

    const createFeedback = async (props: Partial<FeedbackProps> = {}) => {
        const feedbackProps: FeedbackProps = {
            content: props.content || "This is a test feedback",
            userId: props.userId || 1, // Ensure userId is set
            createdAt: props.createdAt || new Date(),
            editedAt: props.editedAt,
            username: props.username || "TestUser"
        };

        return await Feedback.create(sql, feedbackProps);
    };

    beforeEach(async () => {
        await sql`
            INSERT INTO "User" (id, username, email, password)
            VALUES (1, 'TestUser', 'testuser@example.com', 'password123')
            ON CONFLICT (id) DO NOTHING
        `;
    });

    afterEach(async () => {
        const tables = ["Feedback", "User"];

        try {
            for (const table of tables) {
                await sql.unsafe(`DELETE FROM "${table}"`);
                await sql.unsafe(
                    `ALTER SEQUENCE "${table}_id_seq" RESTART WITH 1;`,
                );
            }
        } catch (error) {
            console.error(error);
        }
    });

    // Close the connection to the DB after all tests are done.
    afterAll(async () => {
        await sql.end();
    });

    test("Feedback was created.", async () => {
        const feedback = await createFeedback({ content: "Test feedback" });
        expect(feedback.props.content).toBe("Test feedback");
        expect(feedback.props.userId).toBe(1); // Ensure userId is correctly returned
    });

    test("Feedback was retrieved.", async () => {
        const feedback = await createFeedback({ content: "Test feedback" });
        const readFeedback = await Feedback.read(sql, feedback.props.id!);
        expect(readFeedback?.props.content).toBe("Test feedback");
        expect(readFeedback?.props.userId).toBe(1); // Ensure userId is correctly returned
    });

    test("Feedback was updated.", async () => {
        const feedback = await createFeedback({ content: "Test feedback" });
        await feedback.update({ content: "Updated test feedback" });
        const updatedFeedback = await Feedback.read(sql, feedback.props.id!);
        expect(updatedFeedback?.props.content).toBe("Updated test feedback");
    });

    test("Feedback was deleted.", async () => {
        const feedback = await createFeedback({ content: "Test feedback" });
        await feedback.delete();
        const deletedFeedback = await Feedback.read(sql, feedback.props.id!);
        expect(deletedFeedback).toBeNull();
    });
});
