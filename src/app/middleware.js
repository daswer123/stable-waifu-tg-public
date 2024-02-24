import { createUserPreferences, getSessionFromDatabase, getUserFromDatabase, saveSessionToDatabase, saveUserToDatabase } from "../backend/db/db_users.js";
import { withErrorHandling } from "../utils/funcs.js";
import { INITIAL_SESSION } from "../utils/variables.js";

// Middlewares
export async function handleMiddleware(ctx, next) {
    // Attempting to retrieve a session from the database
    try {
        // console.log("START",ctx.session)
        // console.log(ctx.session)
    // Checking if there is a local session
        if (!ctx.session || Object.keys(ctx.session).length === 0) {
            // If there is no local session, attempt to get a session from the database
            ctx.session = { ...INITIAL_SESSION };
            console.log("Загрузка сессииииииии")
            
        }

        // Checking if the user is in the database
        if (!ctx.session.inDatabase) {
            const user = await getUserFromDatabase(ctx.from.id);
            if (!user) {
                // If the user does not exist in the database, add him/her and assign the status 'default'
                await saveUserToDatabase(ctx.from.id, ctx.from.username, "default");
            }   await createUserPreferences(ctx.from.id);
            // Mark that the user is now in the database
            ctx.session.inDatabase = true;
        }

        // If the number of keys in the local session and the initialized session is different
        // or if any value in the session is `undefined`
        // for (let key in INITIAL_SESSION) {
        //     if (!(key in ctx.session) || ctx.session[key] === undefined) {
        //         ctx.session[key] = INITIAL_SESSION[key];
        //     }
        // }

        next(); // Обработка сообщения ботом
        
        // Saving a session to the database after a bot response
        // console.log("AFTER",ctx.session)
        // await saveSessionToDatabase(ctx.from.id, ctx.session);
    } catch (err) {
        console.log(err);
    }
}
