const fs = require('fs');
const path = require('path');
const express = require('express');
const { exec } = require('child_process');
const { MongoClient } = require('mongodb');
const func = require('./common.js');

const app = express();
const port = process.env.PORT || 3009;

const username = encodeURIComponent('abdul');
const password = encodeURIComponent('nf@99');
const hostname = '13.232.204.77';
const port_db = '27017';
const database = 'truecallerjs';

const url = `mongodb://${username}:${password}@${hostname}:${port_db}/?authSource=${database}`;

const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

// API for truecaller
app.use(express.json());

app.post('/api/truecaller-search', async (req, res) => {
    const { mobile } = req.body;

        const clientIP = req.ip;
        const allowedIPs = ['128.199.22.142', '139.59.35.194'];
        if (!allowedIPs.some(allowedIP => clientIP.includes(allowedIP))) {
            return res.status(404).json({ error: 'Not allowed from this IP' });
        }
    

    try {
        // Connect to the MongoDB database
        await client.connect();

        // Define the collection after connecting
        const last_request = client.db(database).collection('last_request');
        const last_request_id = await last_request.find({ u_id: 1 }).toArray();
        const data_nums = last_request_id[0].last_id;

        // Count the total
        const count = await client.db(database).collection('auth_proxy').countDocuments();

        if (data_nums > count || data_nums === 0 || !data_nums) {
            res.status(404).json({ error: 'Not enough auth keys' });
            return;
        }

        // Use Promise to await the completion of get_exec_data
        const response = await new Promise((resolve) => {
            func.get_exec_data(mobile, data_nums, count, (response) => {
                resolve(response);
            });
        });

        if (response.success == 'true') {
            res.json(response);
        } else {


            if (data_nums + 1 > count) {
                var next_server = 1;
            }
            else {
                var next_server = data_nums + 1;
            }
            const authkey_proxy = client.db(database).collection('auth_proxy');
            const filteredDocs = await authkey_proxy.find({ id: (next_server) }).toArray();

            if (filteredDocs.length === 0) {
                res.status(404).json({ error: 'Data not found' });
                return;
            }
            const newData = filteredDocs[0];

            if (!newData) {
                res.status(500).json({ error: 'New data not found in the database' });
                return;
            }

            // Specify the file path
            const folderPath = '/home/ubuntu/.config/truecallerjs';
            const proxy_path = '/etc';
            const filePath = path.join(folderPath, 'authkey.json');
            const proxy_file = path.join(proxy_path, 'proxychains.conf');

            // Ensure the folder exists
            func.create_file_dir(proxy_path);
            func.create_file_dir(folderPath);

            // Write the new data to the file
            func.write_file(filePath, JSON.stringify(newData.authkey));
            func.write_file(proxy_file, newData.proxy);

            // Update the last request ID
            const result = await last_request.updateOne({ u_id: 1 }, { $set: { last_id: (next_server) } }, { upsert: true });
            if (result.modifiedCount > 0) {
                // Call the get_exec_data function again
                const updatedResponse = await new Promise((resolve) => {
                    func.get_exec_data(mobile, next_server, count, (response) => {
                        resolve(response);
                    });
                });

                res.json(updatedResponse);
            } else {
                res.status(404).json({ error: 'Not enough auth keys after update' });
            }
        }
    } catch (err) {
        console.error('MongoDB connection error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // Close the MongoDB client
        await client.close();
    }
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
