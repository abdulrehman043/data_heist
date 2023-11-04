const fs = require('fs');
const { exec } = require('child_process');


/**
 * Writes data to a file.
 *
 * @param {string} filePath - The path to the file where data will be written.
 * @param {string} newDataString - The data to write to the file.
 */
function write_file(filePath, newDataString) {
    fs.writeFile(filePath, newDataString, 'utf8', (err) => {
        if (err) {
            console.error('Error writing to file:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            console.log('File updated successfully.');
        }
    });
}

/**
 * Create a directory if it doesn't already exist.
 *
 * This function checks if the specified directory exists, and if not, it creates it.
 *
 * @param {string} folderPath - The path of the directory to create.
 * @returns {void}
 * @throws {Error} If there is an error during directory creation.
 */
function create_file_dir(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
}

function get_exec_data(mobile, data_nums, count, callback) {
    // Construct the command to execute
    const command = `proxychains npx truecallerjs -s ${mobile} --json`;

    // Execute the command in the shell
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Command execution error: ${error}`);
            callback({ error: 'Internal Server Error' });
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
            callback({ error: 'Internal Server Error' });
            return;
        }

        const json_success = {
            'success': jsonResponse.data ? 'true' : 'false',
            'server': data_nums, // Make sure data_nums is defined
            'total_servers': count, // Make sure count is defined
            'result': jsonResponse.data
        };

        // Call the callback function with the result
        callback(json_success);
    });
}

module.exports = {
    write_file,
    create_file_dir,
    get_exec_data
};
