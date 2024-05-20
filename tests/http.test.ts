import postgres from "postgres";
import { StatusCode } from "../src/router/Response";
import { HttpResponse, clearCookieJar, makeHttpRequest } from "./client";
import {
	test,
	describe,
	expect,
	afterEach,
	beforeEach,
} from "vitest";

describe("HTTP operations", () => {
	const sql = postgres({
		database: "MyDB",
	});

	beforeEach(async () => {
		// Anything you want to do before each test runs?
	});

	/**
	 * Clean up the database after each test. This function deletes all the rows
	 * from the todos and subtodos tables and resets the sequence for each table.
	 * @see https://www.postgresql.org/docs/13/sql-altersequence.html
	 */
	afterEach(async () => {
		// Replace the table_name with the name of the table(s) you want to clean up.
		const tables = ["table_name"];

		try {
			for (const table of tables) {
				await sql.unsafe(`DELETE FROM ${table}`);
				await sql.unsafe(
					`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`,
				);
			}
		} catch (error) {
			console.error(error);
		}

		await makeHttpRequest("POST", "/logout");
		clearCookieJar();
	});

	test("Homepage was retrieved successfully.", async () => {
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"GET",
			"/",
		);

		expect(statusCode).toBe(StatusCode.OK);
		expect(Object.keys(body).includes("message")).toBe(true);
		expect(Object.keys(body).includes("payload")).toBe(true);
		expect(body.message).toBe("Homepage!");
	});

	test("Invalid path returned error.", async () => {
		const { statusCode, body }: HttpResponse = await makeHttpRequest(
			"GET",
			"/foo",
		);

		expect(statusCode).toBe(StatusCode.NotFound);
		expect(Object.keys(body).includes("message")).toBe(true);
		expect(Object.keys(body).includes("payload")).toBe(false);
		expect(body.message).toBe("Invalid route: GET /foo");
	});
});

// import postgres from "postgres";
// import { StatusCode } from "../src/router/Response";
// import { HttpResponse, clearCookieJar, makeHttpRequest } from "./client";
// import { test, describe, expect, afterEach, beforeAll, afterAll } from "vitest";
// import Server from "../src/Server";
// import Feedback, { FeedbackProps } from "../src/models/Feedback";
// import { createUTCDate } from "../src/utils";

// describe("Feedback HTTP operations", () => {
//     const sql = postgres({
//         database: "MischievousQuizDB",
//     });

//     const server = new Server({
//         host: "localhost",
//         port: 3000,
//         sql,
//     });

//     beforeAll(async () => {
//         await server.start();
//     });

//     afterEach(async () => {
//         const tables = ["Feedback"];

//         try {
//             for (const table of tables) {
//                 await sql.unsafe(`DELETE FROM ${table}`);
//                 await sql.unsafe(
//                     `ALTER SEQUENCE ${table}_id_seq RESTART WITH 1;`,
//                 );
//             }
//         } catch (error) {
//             console.error(error);
//         }

//         await makeHttpRequest("POST", "/logout");
//         clearCookieJar();
//     });

//     afterAll(async () => {
//         await sql.end();
//         await server.stop();
//     });

//     const createFeedback = async (props: Partial<FeedbackProps> = {}) => {
//         const feedbackProps: FeedbackProps = {
//             content: props.content || "Test Feedback",
//             createdAt: props.createdAt || createUTCDate(),
//             userId: props.userId || 1,
//         };

//         return await Feedback.create(sql, feedbackProps);
//     };

//     test("Homepage was retrieved successfully.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "GET",
//             "/",
//         );

//         expect(statusCode).toBe(StatusCode.OK);
//         expect(Object.keys(body).includes("message")).toBe(true);
//         expect(Object.keys(body).includes("payload")).toBe(true);
//         expect(body.message).toBe("Homepage!");
//     });

//     test("Invalid path returned error.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "GET",
//             "/foo",
//         );

//         expect(statusCode).toBe(StatusCode.NotFound);
//         expect(Object.keys(body).includes("message")).toBe(true);
//         expect(Object.keys(body).includes("payload")).toBe(false);
//         expect(body.message).toBe("Invalid route: GET /foo");
//     });

//     test("Feedback was created.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "POST",
//             "/feedbacks",
//             {
//                 content: "This is a test feedback",
//                 userId: 1,
//             },
//         );

//         expect(statusCode).toBe(StatusCode.Created);
//         expect(Object.keys(body).includes("message")).toBe(true);
//         expect(Object.keys(body).includes("payload")).toBe(true);
//         expect(body.message).toBe("Feedback created successfully!");
//         expect(Object.keys(body.payload.feedback).includes("id")).toBe(true);
//         expect(Object.keys(body.payload.feedback).includes("content")).toBe(true);
//         expect(Object.keys(body.payload.feedback).includes("userId")).toBe(true);
//         expect(body.payload.feedback.content).toBe("This is a test feedback");
//         expect(body.payload.feedback.userId).toBe(1);
//     });

//     test("Feedback was not created due to missing content.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "POST",
//             "/feedbacks",
//             {
//                 userId: 1,
//             },
//         );

//         expect(statusCode).toBe(StatusCode.BadRequest);
//         expect(Object.keys(body).includes("message")).toBe(true);
//         expect(Object.keys(body).includes("payload")).toBe(false);
//         expect(body.message).toBe("Request body must include content.");
//     });

//     test("Feedback was retrieved.", async () => {
//         const feedback = await createFeedback();
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "GET",
//             `/feedbacks/${feedback.props.id}`,
//         );

//         expect(statusCode).toBe(StatusCode.OK);
//         expect(body.message).toBe("Feedback retrieved");
//         expect(body.payload.feedback.content).toBe(feedback.props.content);
//         expect(body.payload.feedback.userId).toBe(feedback.props.userId);
//         expect(body.payload.feedback.createdAt).toBe(
//             feedback.props.createdAt?.toISOString(),
//         );
//     });

//     test("Feedback was not retrieved due to invalid ID.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "GET",
//             "/feedbacks/abc",
//         );

//         expect(statusCode).toBe(StatusCode.BadRequest);
//         expect(body.message).toBe("Invalid ID");
//         expect(body.payload).toBeUndefined();
//     });

//     test("Feedback was not retrieved due to non-existent ID.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "GET",
//             "/feedbacks/1",
//         );

//         expect(statusCode).toBe(StatusCode.NotFound);
//         expect(body.message).toBe("Not found");
//         expect(body.payload).toBeUndefined();
//     });

//     test("Feedback was updated.", async () => {
//         const feedback = await createFeedback();
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "PUT",
//             `/feedbacks/${feedback.props.id}`,
//             {
//                 content: "Updated test feedback",
//             },
//         );

//         expect(statusCode).toBe(StatusCode.OK);
//         expect(body.message).toBe("Feedback updated successfully!");
//         expect(body.payload.feedback.content).toBe("Updated test feedback");
//         expect(body.payload.feedback.userId).toBe(feedback.props.userId);
//         expect(body.payload.feedback.createdAt).toBe(
//             feedback.props.createdAt?.toISOString(),
//         );
//         expect(body.payload.feedback.editedAt).not.toBeNull();
//     });

//     test("Feedback was not updated due to invalid ID.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "PUT",
//             "/feedbacks/abc",
//             {
//                 content: "Updated test feedback",
//             },
//         );

//         expect(statusCode).toBe(StatusCode.BadRequest);
//         expect(body.message).toBe("Invalid ID");
//         expect(body.payload).toBeUndefined();
//     });

//     test("Feedback was not updated due to non-existent ID.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "PUT",
//             "/feedbacks/1",
//             {
//                 content: "Updated test feedback",
//             },
//         );

//         expect(statusCode).toBe(StatusCode.NotFound);
//         expect(body.message).toBe("Not found");
//         expect(body.payload).toBeUndefined();
//     });

//     test("Feedback was deleted.", async () => {
//         const feedback = await createFeedback();
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "DELETE",
//             `/feedbacks/${feedback.props.id}`,
//         );

//         expect(statusCode).toBe(StatusCode.OK);
//         expect(body.message).toBe("Feedback deleted successfully!");
//     });

//     test("Feedback was not deleted due to invalid ID.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "DELETE",
//             "/feedbacks/abc",
//         );

//         expect(statusCode).toBe(StatusCode.BadRequest);
//         expect(body.message).toBe("Invalid ID");
//         expect(body.payload).toBeUndefined();
//     });

//     test("Feedback was not deleted due to non-existent ID.", async () => {
//         const { statusCode, body }: HttpResponse = await makeHttpRequest(
//             "DELETE",
//             "/feedbacks/1",
//         );

//         expect(statusCode).toBe(StatusCode.NotFound);
//         expect(body.message).toBe("Not found");
//         expect(body.payload).toBeUndefined();
//     });

// 	test("All feedbacks were retrieved.", async () => {
// 		await createFeedback();
// 		await createFeedback();
// 		const { statusCode, body }: HttpResponse = await makeHttpRequest(
// 			"GET",
// 			"/feedbacks",
// 		);
	
// 		expect(statusCode).toBe(StatusCode.OK);
// 		expect(body.message).toBe("All feedbacks retrieved");
// 		expect(body.payload.feedbacks).toBeInstanceOf(Array);
// 		expect(body.payload.feedbacks).toHaveLength(2);
// 	});
	
// });


/*lost my real tests, which i was passing.. this isn't quite aligned */