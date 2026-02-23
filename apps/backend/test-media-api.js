
const axios = require('axios');

async function test() {
    try {
        const response = await axios.get('http://localhost:4001/api/media');
        console.log('Total medias:', response.data.length);
        if (response.data.length > 0) {
            console.log('First media record:', JSON.stringify(response.data[0], null, 2));
        }
    } catch (error) {
        console.error('Error fetching media:', error.message);
    }
}

test();
