import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";

export interface FeedbackProps {
    id?: number;
    content: string;
    createdAt?: Date;
    editedAt?: Date;
    userId: number;
    username?: string;
}

export default class Feedback {
    static table = "Feedback";

    constructor(private sql: postgres.Sql<any>, public props: FeedbackProps) {}

    static async create(sql: postgres.Sql<any>, props: FeedbackProps) {
        const [feedback] = await sql<FeedbackProps[]>`
            INSERT INTO ${sql(Feedback.table)} (content, created_at, user_id)
            VALUES (${props.content}, ${props.createdAt ?? new Date()}, ${props.userId})
            RETURNING id, content, created_at AS "createdAt", edited_at AS "editedAt", user_id AS "userId"
        `;
        return new Feedback(sql, feedback);
    }

    static async read(sql: postgres.Sql<any>, id: number) {
        const [feedback] = await sql<FeedbackProps[]>`
            SELECT feedback.id, feedback.content, feedback.created_at AS "createdAt", feedback.edited_at AS "editedAt", feedback.user_id AS "userId", users.username
            FROM ${sql(Feedback.table)} feedback
            JOIN "User" users ON feedback.user_id = users.id
            WHERE feedback.id = ${id}
        `;
        return feedback ? new Feedback(sql, feedback) : null;
    }

    static async readAll(sql: postgres.Sql<any>) {
        const feedbacks = await sql<FeedbackProps[]>`
            SELECT feedback.id, feedback.content, feedback.created_at AS "createdAt", feedback.edited_at AS "editedAt", feedback.user_id AS "userId", users.username
            FROM ${sql(Feedback.table)} feedback
            JOIN "User" users ON feedback.user_id = users.id
            ORDER BY feedback.created_at DESC
        `;
        return feedbacks.map((feedback) => new Feedback(sql, feedback));
    }

    static async readByUser(sql: postgres.Sql<any>, userId: number) {
        const feedbacks = await sql<FeedbackProps[]>`
            SELECT feedback.id, feedback.content, feedback.created_at AS "createdAt", feedback.edited_at AS "editedAt", feedback.user_id AS "userId", users.username
            FROM ${sql(Feedback.table)} feedback
            JOIN "User" users ON feedback.user_id = users.id
            WHERE feedback.user_id = ${userId}
            ORDER BY feedback.created_at DESC
        `;
        return feedbacks.map((feedback) => new Feedback(sql, feedback));
    }

    async update(updateProps: Partial<FeedbackProps>) {
        const connection = await this.sql.reserve();
    
        const [row] = await connection<FeedbackProps[]>`
            UPDATE ${this.sql(Feedback.table)}
            SET ${this.sql(convertToCase(camelToSnake, updateProps))}, edited_at = ${new Date()}
            WHERE id = ${this.props.id}
            RETURNING id, content, created_at AS "createdAt", edited_at AS "editedAt", user_id AS "userId"
        `;
    
        await connection.release();
    
        this.props = { ...this.props, ...convertToCase(snakeToCamel, row) };
    }

    async delete() {
        await this.sql`
            DELETE FROM ${this.sql(Feedback.table)}
            WHERE id = ${this.props.id}
        `;
    }
}
