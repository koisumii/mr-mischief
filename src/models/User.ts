import postgres from "postgres";

export interface UserProps {
    id?: number;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    lastLogin?: Date;
}

export class DuplicateEmailError extends Error {
    constructor() {
        super("User with this email already exists.");
    }
}

export class InvalidCredentialsError extends Error {
    constructor() {
        super("Invalid credentials.");
    }
}

export default class User {
    constructor(
        private sql: postgres.Sql<any>,
        public props: UserProps,
    ) {}

    /**
     * Create a new user in the database.
     * @param sql - Postgres client instance
     * @param props - User properties
     * @returns - New User instance
     * @throws - DuplicateEmailError if the email already exists
     */
    static async create(
        sql: postgres.Sql<any>,
        props: UserProps,
    ): Promise<User> {
        const existingUser = await sql<UserProps[]>`
        SELECT 1 FROM "User" WHERE email = ${props.email}
        `;

        if (existingUser.length > 0) {
            throw new DuplicateEmailError();
        }

        const result = await sql<UserProps[]>`
        INSERT INTO "User" (username, email, password, created_at)
        VALUES (${props.username}, ${props.email}, ${props.password}, now())
        RETURNING id, username, email, password, created_at AS "createdAt", last_login AS "lastLogin"
        `;

        return new User(sql, result[0]);
    }

    /**
     * Log in a user by verifying email and password.
     * @param sql - Postgres client instance
     * @param email - User's email
     * @param password - User's password
     * @returns - User instance
     * @throws - InvalidCredentialsError if the credentials are invalid
     */
    static async login(
        sql: postgres.Sql<any>,
        email: string,
        password: string,
    ): Promise<User> {
        const result = await sql<UserProps[]>`
        SELECT id, username, email, password, created_at AS "createdAt", last_login AS "lastLogin"
        FROM "User"
        WHERE email = ${email} AND password = ${password}
        `;

        if (result.length === 0) {
            throw new InvalidCredentialsError();
        }

        return new User(sql, result[0]);
    }
}