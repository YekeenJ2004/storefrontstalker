import { User, Storefront } from "./schemas.js";
import { addASINsToStorefront, connectToDB, getArrayDifference, sendEmbedToUser } from "./utils.js";
import axios from 'axios'
import cron from 'node-cron'
import dotenv from 'dotenv';
import { client } from "./main.js";
dotenv.config();


async function getSellerProducts(sellerId, domain = 2) {
    const url = `https://api.keepa.com/seller?key=${process.env.KEEPA_API_KEY}&domain=${domain}&seller=${sellerId}&storefront=1`;
    
    try {
        const response = await axios.get(url);
        
        if (response.status === 200) {
            console.log("Successfully retrieved details from Keepa");
            const res = response.data;
            const sellers = res.sellers;
            const sellerData = sellers[sellerId];

            if (sellerData) {
                const sellerName = sellerData.sellerName;
                const ASINs = sellerData.asinList;
                return { ASINS: ASINs, sellerName: sellerName };
            } else {
                console.log("Seller data not found.");
                return null;
            }
        } else {
            console.log("Failed to retrieve details from Keepa");
            return null;
        }
    } catch (error) {
        console.error("Error retrieving data:", error.response ? error.response.data : error.message);
        return null;
    }
}





export const updatestorefront =async () => {
    console.log("Running hourly storefront check");
    connectToDB()
    const allStorefronts = await Storefront.find();
    let x = 1
    for (const storefront of allStorefronts) {
        if(x%19 == 20){
            await sleep(90000)
        }
        x= x+1
        try {
            const response = await getSellerProducts(storefront.storefrontId, 2) // Hypothetical Keepa API call
            const current_asins  = response.ASINS
            let old_asins = storefront.asins
            let new_asins = getArrayDifference(old_asins, current_asins)
            console.log(new_asins)
            if (new_asins.length > 0) {
                await addASINsToStorefront(storefront.storefrontId, current_asins)
                const users = await User.find({ storefrontIds: storefront.storefrontId });
                for (const user of users) {
                    const dm = await client.users.fetch(user.userId);
                    await sendEmbedToUser(client, user.userId, new_asins,response.sellerName) 
                    //await dm.send(`Update for ${response.sellerName}:\nNew ASINs:\n${new_asins.join('\n')}`);
                }
            }
        } catch (error) {
            console.error(`Error checking storefront ${storefront.storefrontId}:`, error);
        }
    }
}
