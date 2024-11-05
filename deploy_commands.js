import {REST, Routes} from 'discord.js'
import { commands } from './commands.js';
import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.BOT_TOKEN)
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
 
export const deployCommands = async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.SERVERID),
            { body: commands },
        );
        console.log('Slash commands registered.');
    } catch (error) {
        console.error(error);
    }
};