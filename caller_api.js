const fs = require('fs');
const path = require('path');
const express = require('express');
const { exec } = require('child_process');
const { MongoClient } = require('mongodb');
const func = require('./functions.js');

const app = express();
const port = process.env.PORT || 3004;

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
    const { data_nums } = req.body;

    // if (req.ip !== '128.199.22.142') {
    //         res.status(404).json({ error: 'Not allowed from this IP' });
                //return;
    //   }

    try {
        // Connect to the MongoDB database
        await client.connect();
        // Define the collection after connecting
        const last_request = client.db(database).collection('last_request');
        const last_request_id = await last_request.find({ u_id: 1 }).toArray();

        //Count the to
        const count = await  client.db(database).collection('auth_proxy').countDocuments();

        if(data_nums > count || data_nums == 0 || !data_nums)
        {
            res.status(404).json({ error: 'Not enough auth keys.' });
            return;
        }

     

        // If we have last request same as last_id then don't update the files
        if (last_request_id[0].last_id != data_nums) {
            const authkey_proxy = client.db(database).collection('auth_proxy');
            const filteredDocs = await authkey_proxy.find({ id: data_nums }).toArray();
            if (filteredDocs.length === 0) {
                res.status(404).json({ error: 'Data not found' });
                return;
            }
            const newData = filteredDocs[0];

            // If newData is undefined or null, return an error
            if (!newData) {
                res.status(500).json({ error: 'Data not found in the database' });
                return;
            }

            // Specify the file path
            const folderPath = '/home/ubuntu/.config/truecallerjs';
            const proxy_path = '/etc'
            const filePath = path.join(folderPath, 'authkey.json');
            const proxy_file = path.join(proxy_path, 'proxychains.conf');

            // Ensure the folder exists
            func.create_file_dir(proxy_path);
            func.create_file_dir(folderPath);


            // Write the new data to the file
            func.write_file(filePath, JSON.stringify(newData.authkey));
            func.write_file(proxy_file, newData.proxy);

            // Update the last request ID
            await last_request.updateOne({ u_id: 1 }, { $set: { last_id: data_nums } }, { upsert: true });

        }

        // Construct the command to execute
        const command = `proxychains npx truecallerjs -s ${mobile} --json`;

        // Execute the command in the shell
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error}`);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // Log the command output
            console.log('Command output:', stdout);

            // Parse the JSON output if needed
            let jsonResponse;
            try {
                const validJsonStart = stdout.indexOf('{');
                if (validJsonStart !== -1) {
                    const validJsonString = stdout.slice(validJsonStart);
                    try {
                        jsonResponse = JSON.parse(validJsonString);
                    } catch (error) {
                        console.error('JSON parsing error:', error);
                    }
                }
            } catch (parseError) {
                console.error(`JSON parsing error: ${parseError}`);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            // Respond with the JSON output
            res.json(jsonResponse);
        });
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
