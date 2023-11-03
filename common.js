const fs = require('fs');

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

module.exports = {
    write_file,
    create_file_dir
};
