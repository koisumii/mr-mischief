DROP DATABASE IF EXISTS "MischievousQuizDB";
CREATE DATABASE "MischievousQuizDB";

\c MischievousQuizDB;

DROP TABLE IF EXISTS User;
CREATE TABLE User (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

DROP TABLE IF EXISTS QuizSession;
CREATE TABLE QuizSession (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed', 'aborted')),
    questionIds TEXT, -- simplifies tracking which questions were used
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS Answer;
CREATE TABLE Answer(
    id SERIAL PRIMARY KEY,
    question_id INT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES Question(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS Question;
CREATE TABLE Question (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    correct_answer_id INT,
    FOREIGN KEY (correct_answer_id) REFERENCES Answer(id)
);

DROP TABLE IF EXISTS UserAnswer;
CREATE TABLE UserAnswer(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_id INT NOT NULL,
    is_correct BOOLEAN NOT NULL, -- Stores if the user's selected answer was correct
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES QuizSession(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES Question(id) ON DELETE CASCADE,
    FOREIGN KEY (answer_id) REFERENCES Answer(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS Score;
CREATE TABLE Score (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NOT NULL,
    current_score INT NOT NULL,
    highest_score INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES QuizSession(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS Feedback;
CREATE TABLE Feedback (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);