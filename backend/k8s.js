//@flow

const { Client } = require("kubernetes-client");

const client = new Client({ version: "1.13" });

module.exports = { client };
