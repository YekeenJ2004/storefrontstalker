export const commands = [
    {
        name: 'addstorefront',
        description: 'Add an Amazon storefront to track',
        options: [
            {
                name: 'storefront_id',
                type: 3, // STRING type
                description: 'The storefront ID to track',
                required: true,
            },
        ],
    },
    {
        name: 'liststorefronts',
        description: 'List all Amazon storefronts you are tracking',
    },
    {
        name: 'removestorefront',
        description: 'Stop stalking a storefront',
        options: [
            {
                name: 'storefront_id',
                type: 3, // STRING type
                description: 'The storefront ID to remove',
                required: true,
            },
        ],
    }
];