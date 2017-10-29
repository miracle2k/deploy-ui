//@flow

const Api = require('kubernetes-client');

// Notice the promises: true
const extClient = new Api.Extensions(Api.config.fromKubeconfig());
const coreClient = new Api.Core(Api.config.fromKubeconfig());

// const client = new Api.Core({
//   url: 'http://my-k8s-api-server.com',
//   version: 'v1',  // Defaults to 'v1'
//   promises: true,  // Enable promises
//   namespace: 'my-project' // Defaults to 'default'
// });

module.exports = {extClient, coreClient};
