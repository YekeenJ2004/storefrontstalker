import mongoose from "mongoose";
import dotenv from 'dotenv';
import { Storefront } from "./schemas.js";
import { EmbedBuilder } from "discord.js";
dotenv.config();

export const connectToDB = async () =>{
    const connection = {}
    try {
        if (connection.isConnected) return 
        const db =  await mongoose.connect(process.env.MONGO);
        connection.isConnected  = db.connections[0].readyState
    } catch (error) {
        console.log('could not connect to db', error)
    }
}

export const addASINsToStorefront= async (storefrontId, new_asins) =>{
    try {
        // Find the storefront by storefrontId
        const storefront = await Storefront.findOne({ storefrontId });

        if (!storefront) {
            console.log('Storefront not found');
            return;
        }

        // Combine existing ASINs with new ASINs, ensuring no duplicates
        storefront.asins = Array.from(new Set([...storefront.asins, ...new_asins]));

        // Save the updated storefront document
        await storefront.save();
        console.log('ASINs added successfully to the storefront');
    } catch (error) {
        console.error('Error adding ASINs to storefront:', error);
    }
}
export const getArrayDifference = (array1, array2) =>{

    if (!array2){
        return(array1)
    }
    // Find items in array1 that aren't in array2
    const uniqueToFirstArray = array1.filter(item => !array2.includes(item));
    
    // Find items in array2 that aren't in array1
    const uniqueToSecondArray = array2.filter(item => !array1.includes(item));
    
    // Combine the differences
    return [...uniqueToFirstArray, ...uniqueToSecondArray];
}

export async function sendEmbedToUser(client, userId, ASINs,sellerName) {
    try {
        // Fetch the user by their ID
        const user = await client.users.fetch(userId);

        // Prepare variables for iteration
        const embeds = [];
        let currentEmbed = new EmbedBuilder()
            .setColor(0x3498db) // Optional: Set a color for the embed
            .setTitle(`${sellerName}ASINs Update (continued)`)
            .setDescription(`Live ASINs for ${sellerName}`)
            .setTimestamp();

        let fieldCount = 0;
        let currentEmbedCharCount = currentEmbed.data.description.length;

        // Iterate through ASINs and add fields
        for (const asin of ASINs) {
            const asinField = { name: 'ASIN', value: `[${asin}](https://sas.selleramp.com/sas/lookup?src=&ver=&SasLookup%5B&asin=${asin})`, inline: true };
            const asinFieldCharCount = asinField.name.length + asinField.value.length;

            // Check if adding this field would exceed limits
            if (fieldCount >= 25 || currentEmbedCharCount + asinFieldCharCount > 6000) {
                // Add the current embed to the embeds array and create a new one
                embeds.push(currentEmbed);
                currentEmbed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle(`${sellerName}ASINs Update (continued)`)
                    .setTimestamp();

                // Reset counters for the new embed
                fieldCount = 0;
                currentEmbedCharCount = 0;
            }

            // Add the ASIN field to the current embed
            currentEmbed.addFields(asinField);
            fieldCount++;
            currentEmbedCharCount += asinFieldCharCount;
        }

        // Push the last embed after the loop if it has fields
        if (fieldCount > 0) {
            embeds.push(currentEmbed);
        }

        // Send all the embeds as direct messages
        for (const embed of embeds) {
            await user.send({ embeds: [embed] });
        }

        console.log('Embeds sent successfully!');
    } catch (error) {
        console.error('Error sending embeds:', error);
    }
}