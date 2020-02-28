import {Client1_13 as Client} from "kubernetes-client";

const client = new Client({ version: "1.13" });

module.exports = { client };
