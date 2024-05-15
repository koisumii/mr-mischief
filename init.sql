DROP DATABASE IF EXISTS "MischievousQuizDB";
CREATE DATABASE "MischievousQuizDB";

\c MischievousQuizDB;

DROP TABLE IF EXISTS "User";
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP
);

DROP TABLE IF EXISTS "QuizSession";
CREATE TABLE "QuizSession" (
    "id" SERIAL PRIMARY KEY,
    "start_time" TIMESTAMP NOT NULL,
    "end_time" TIMESTAMP,
    "status" VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed', 'aborted')),
    "user_id" INTEGER REFERENCES "User"(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS "Answer";
CREATE TABLE "Answer"(
    "id" SERIAL PRIMARY KEY,
    "content" TEXT NOT NULL
);

DROP TABLE IF EXISTS Question;
CREATE TABLE "Question" (
    "id" SERIAL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "correct_answer_id" INTEGER REFERENCES "Answer"(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS "UserAnswer";
CREATE TABLE "UserAnswer"(
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    "session_id" INTEGER REFERENCES "QuizSession"(id) ON DELETE CASCADE,
    "question_id" INTEGER REFERENCES "Question"(id) ON DELETE CASCADE,
    "answer_id" INTEGER REFERENCES "Answer"(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS "Score";
CREATE TABLE "Score" (
    "id" SERIAL PRIMARY KEY,
    "current_score" INT NOT NULL,
    "highest_score" INT NOT NULL,
    "user_id" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
    "session_id" INTEGER REFERENCES "QuizSession"(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS "Feedback";
CREATE TABLE "Feedback" (
    "id" SERIAL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP,
    "user_id" INTEGER REFERENCES "User"(id) ON DELETE CASCADE
);



-- ctrl D selects next line, ctrl shift L is all
-- go right to push alignment
-- ctrl shift right to highlight
-- shift quotation marks

-- ctrl L terminal to clear

-- model
-- Assignment 4 login, set session isLogged
-- SELECT
--     ua.user_id,
--     ua.session_id,
--     ua.question_id,
--     q.content AS question_content,
--     a.content AS user_answer,
--     a_correct.content AS correct_answer,
--     (ua.answer_id = q.correct_answer_id) AS is_correct
-- FROM
--     UserAnswer ua
-- JOIN
--     Question q ON ua.question_id = q.id
-- JOIN
--     Answer a ON ua.answer_id = a.id
-- JOIN
--     Answer a_correct ON q.correct_answer_id = a_correct.id
-- WHERE
--     ua.session_id = 1; -- ??? flexible

-- for calculating score, use the quiz session table in model calculations
-- many relation