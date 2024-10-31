const {createBaseDirectory, createDirectoryForUser, createTableForUser} = require("./db");

createBaseDirectory();
createDirectoryForUser(1);