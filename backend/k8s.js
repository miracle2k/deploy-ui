//@flow

const Api = require('kubernetes-client');


let config;
try {
  config = Api.config.fromKubeconfig();
  console.log('Loaded Kubernetes config from .kube/config')
} catch(e) {
  try {
    config = Api.config.getInCluster();
    console.log('Loaded Kubernetes config from cluster')
  }
  catch(e) {
    console.log('ERROR: Could not find kubernetes config; exiting...')
    process.exit(1)
  }
}

// Notice the promises: true
const extClient = new Api.Extensions(config);
const coreClient = new Api.Core(config);

module.exports = {extClient, coreClient};
