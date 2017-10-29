//@flow
const fetch = require('node-fetch');
const drc = require('docker-registry-client');
const parseDockerUrl = require('./parseDockerUrl');



class Client {
  constructor(repo, dockercfg) {
    const {registry} = parseDockerUrl(repo);
    const auth = dockercfg[`https://${registry}`] || {};

    let opts = {
      name: repo,
    };
    if (auth) {
      Object.assign(opts, auth);
    }
    this.client = drc.createClientV2(opts);
  }

  getTags() {
    return new Promise((resolve, reject) => {
      this.client.listTags((err, tags) => {
        if (err) { reject(err); }
        else { resolve(tags) };
      })
    });
  }
}


module.exports.getAvailableImages = async function getAvailableImages(image, dockercfg) {
  // Parse image
  const {registry, namespace, repository, tag} = parseDockerUrl(image);

  const client = new Client(`${registry}/${namespace}/${repository}`, dockercfg);
  const tagList = await client.getTags();

  const allTags = {};
  Object.values(tagList.manifest).forEach(manifestEntry => {
    if (!manifestEntry.tag) {
      return;
    }

    for (const tag of manifestEntry.tag) {
      if (allTags[tag]) {
        throw new Error('dup tag in manifest') // Is this allowed to happen?
      }

      allTags[tag] = {
        tag,
        imageSizeBytes: manifestEntry.imageSizeBytes,
        timeCreatedMs: parseInt(manifestEntry.timeCreatedMs),
        timeUploadedMs: parseInt(manifestEntry.timeUploadedMs)
      }
    }
  })

  // Sort by date
  let tags = Object.values(allTags);
  tags = tags.sort((a, b) => {
    return b.timeUploadedMs - a.timeUploadedMs;
  });
  return tags;
}
