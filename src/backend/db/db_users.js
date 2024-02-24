import { getFirstModel } from "./db_settings.js";
import {sql} from "./init.js";

export async function createUserTables() {
  // User table
  await sql`
    CREATE SCHEMA IF NOT EXISTS user_data;
  `;
  console.log("Custom schema ready.");


  await sql`
      CREATE TABLE IF NOT EXISTS user_data.users(
          user_id BIGINT PRIMARY KEY,
          username TEXT,
          tokens INTEGER DEFAULT 30,
          status TEXT DEFAULT 'user',
          is_verify BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
  `;
  console.log("Users table ready.");

  await sql`
      CREATE TABLE IF NOT EXISTS user_data.user_settings(
          user_id BIGINT REFERENCES user_data.users(user_id),
          default_model TEXT,
          default_preset TEXT DEFAULT '',
          default_type TEXT DEFAULT 'portrait',
          default_strength TEXT DEFAULT 'Стандартная',
          default_ar TEXT DEFAULT '1:1'
      )
  `;
  console.log("Users table ready.");

  // Session table
  await sql`
      CREATE TABLE IF NOT EXISTS user_data.sessions(
          session_id SERIAL PRIMARY KEY,
          user_id BIGINT REFERENCES user_data.users(user_id),
          session TEXT
      )
  `;
  console.log("Session table ready.");
}

// Users funcs
export async function getUserFromDatabase( user_id) {
  const [row] = await sql`
      SELECT * FROM user_data.users WHERE user_id = ${user_id}
  `;

  return row || null;
}

export async function saveUserToDatabase( user_id, username) {
 await sql`
     INSERT INTO user_data.users(user_id, username)
     VALUES(${user_id}, ${username || "No username"})
 `;
}


// user_id BIGINT REFERENCES users(user_id),
// default_model TEXT,
// default_preset TEXT DEFAULT '',
// default_type TEXT DEFAULT 'portrait',
// default_strength TEXT DEFAULT 'Стандартная',
// default_ar TEXT DEFAULT '1:1'

export async function createUserPreferences(user_id) {
    const firstModel = await getFirstModel()
    console.log(firstModel,"Firstclass")
    
    const defaultSettigns = {
        default_model: firstModel.model_name,
        default_preset: "",
        default_type: "portrait",
        default_strength: "Стандартная",
        default_ar: "1:1"  ,
    }

    await sql`
        INSERT INTO user_data.user_settings (user_id, default_model, default_preset, default_type, default_strength,default_ar) 
        VALUES (${user_id}, ${defaultSettigns.default_model}, ${defaultSettigns.default_preset}, ${defaultSettigns.default_type}, ${defaultSettigns.default_strength}, ${defaultSettigns.default_ar})
    `
}

export async function getUserPreferences(user_id) {
    const [row] = await sql`
        SELECT * FROM user_data.user_settings WHERE user_id = ${user_id}
    `;

    return row || null;  // Return null if no row found, otherwise return the row object. 
}

export async function updateUserPreferences(user_id, data){
    await sql`
        UPDATE user_data.user_settings SET default_model=${data.default_model}, default_type=${data.default_type || "portrait"}, default_ar=${data.default_ar || "1:1"} WHERE user_id=${user_id}
    `
}

export async function getAllUsersFromDatabase() {
    const rows = await sql`
        SELECT user_data.user_id FROM users
    `;
    return rows.map(row => row.user_id);
}

export async function setUserLanguage( user_id, language) {
    await sql`
        UPDATE user_data.users SET language=${language} WHERE user_id=${user_id}
    `;
}

// Sessions funcs
export async function getSessionFromDatabase(user_id) {
    
    const [row] = await sql`
        SELECT * FROM user_data.sessions WHERE user_id = ${user_id}
    `;

    console.log(row,"РАВКА")

    return row ? await JSON.parse(row.session) : null; // Parse the session JSON string back into an object
}

export async function saveSessionToDatabase(user_id, session) {
    const filteredSession = JSON.stringify(session);

    // Проверяем наличие сессии в базе данных
    const [existing] = await sql`
        SELECT session_id FROM user_data.sessions WHERE user_id = ${user_id}
    `;

    if (existing) {
        // Если сессия найдена - обновляем её
        await sql`
            UPDATE user_data.sessions SET session = ${filteredSession} WHERE user_id = ${user_id}
        `;
    } else {
        // Если нет - создаем новую
        await sql`
            INSERT INTO user_data.sessions(user_id, session) VALUES (${user_id}, ${filteredSession})
        `;
    }
}



// export default db;