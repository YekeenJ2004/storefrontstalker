import cron from 'node-cron' 
import { User } from './schemas.js';
import { connectToDB } from './utils.js';
import dotenv from 'dotenv';
import {client} from './main.js'
dotenv.config();


// Set the name of the required role
const REQUIRED_ROLE_NAME = process.env.ALLOWEDROLE;
connectToDB()

// Schedule a daily cron job to check user roles
export const roleupdate =  async () => {
    console.log("Running daily user role check");

    // Fetch all users from the database
    const allUsers = await User.find();

    for (const user of allUsers) {
        try {
            // Fetch the guild member for the user to check roles
            const guild = client.guilds.cache.get(process.env.SERVERID);
            const member = await guild.members.fetch(user.userId);

            // Check if the user still has the required role
            const hasRequiredRole = member.roles.cache.some(role => role.name === REQUIRED_ROLE_NAME);

            // If the user doesn't have the role, remove them from the database
            if (!hasRequiredRole) {
                await User.deleteOne({ userId: user.userId });
                console.log(`Removed user ${user.userId} from the database (no required role)`);
            }
        } catch (error) {
            // If there's an error (e.g., the user has left the server), also remove them from the database
            if (error.code === 10007) { // Discord API error for unknown user
                await User.deleteOne({ userId: user.userId });
                console.log(`Removed user ${user.userId} from the database (user not found)`);
            } else {
                console.error(`Error checking role for user ${user.userId}:`, error);
            }
        }
    }
};
