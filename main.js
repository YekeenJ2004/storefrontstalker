import  { Client, GatewayIntentBits, InteractionType,ActionRowBuilder, StringSelectMenuBuilder } from'discord.js';
import {User, Storefront} from "./schemas.js"
import { connectToDB } from "./utils.js";
import dotenv from 'dotenv';
import cron from 'node-cron'
import { updatestorefront } from './storefrontsupdate.js';
import { roleupdate } from './roleupdate.js';
import { deployCommands } from './deploy_commands.js';
dotenv.config();

connectToDB()

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'addstorefront') {
        const storefrontId = interaction.options.getString('storefront_id');
        const userId = interaction.user.id;

        // Check if user has the required role
        const userRole = interaction.member.roles.cache.some(role => role.name === process.env.ALLOWEDROLE);
        if (!userRole) {
            return interaction.reply({
                content: 'You do not have permission to use this bot.',
                ephemeral: true
            });
        }

        let user = await User.findOne({ userId });
        if (!user) {
            user = new User({ userId, role: process.env.ALLOWEDROLE, storefrontIds: [] });
        }

        if (user.storefrontIds.length >= 5) {
            return interaction.reply({
                content: 'You can only track up to 5 storefronts.',
                ephemeral: true
            });
        }

        if (!user.storefrontIds.includes(storefrontId)) {
            user.storefrontIds.push(storefrontId);
            await user.save();

            const existing = await Storefront.findOne({ storefrontId });
            if (!existing) {
                await new Storefront({ storefrontId }).save();
            }

            interaction.reply({
                content: `Added storefront ${storefrontId} to your tracking list.`,
                ephemeral: true
            });
        } else {
            interaction.reply({
                content: 'You already track this storefront',
                ephemeral: true
            });
        }
    }
});


client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'liststorefronts') {
        const userId = interaction.user.id;
        const user = await User.findOne({ userId });

        if (!user || user.storefrontIds.length === 0) {
            return interaction.reply({
                content: 'You have no storefronts being tracked.',
                ephemeral: true
            });
        }

        interaction.reply({
            content: `Your tracked storefronts: ${user.storefrontIds.join(', ')}`,
            ephemeral: true
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'removestorefront') {
        const storefrontId = interaction.options.getString('storefront_id');
        const userId = interaction.user.id;

        // Fetch the user from the database
        let user = await User.findOne({ userId });

        // If user doesn't have a tracking list or the storefront isn't in the list
        if (!user || !user.storefrontIds.includes(storefrontId)) {
            return interaction.reply({
                content: 'This storefront is not in your tracking list.',
                ephemeral: true,
            });
        }

        // Remove the storefront ID from the user's list
        user.storefrontIds = user.storefrontIds.filter(id => id !== storefrontId);
        await user.save();

        interaction.reply({
            content: `Removed storefront ${storefrontId} from your tracking list.`,
            ephemeral: true,
        });

        // Optional: Remove the storefront from Master Collection if no other users are tracking it
        const stillTracked = await User.findOne({ storefrontIds: storefrontId });
        if (!stillTracked) {
            await Storefront.deleteOne({ storefrontId });
        }
    }
});
deployCommands()
client.login(process.env.BOT_TOKEN);
cron.schedule('0 * * * *', updatestorefront);
cron.schedule('0 0 * * *', roleupdate)