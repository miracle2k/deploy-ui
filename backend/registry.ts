// @ts-ignore
const fetch = require("node-fetch");
const drc = require("docker-registry-client");
const parseDockerUrl = require("./parseDockerUrl").default;


class Client {
  client: any;

  constructor(repo: string, dockercfg: any) {
    const { registry } = parseDockerUrl(repo);

    // This is the new format.
    if ('auths' in dockercfg) {
      dockercfg = dockercfg['auths']
    }

    const auth = dockercfg ? dockercfg[`https://${registry}`] || {} : {};

    let opts = {
      name: repo
    };
    if (auth) {
      Object.assign(opts, auth);
    }
    this.client = drc.createClientV2(opts);
  }

  getTags(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.client.listTags((err: any, tags: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(tags.tags);
        }
      });
    });
  }

  getManifest(tag: string) {
    return new Promise((resolve, reject) => {
      this.client.getManifest({ref: tag}, (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports.getAvailableImages = async function getAvailableImages(
  image: string,
  dockercfg: any
) {
  // Parse image
  const { registry, namespace, repository, tag, fullname } = parseDockerUrl(image);

  const client = new Client(
    fullname,
    dockercfg
  );
  const tagList = await client.getTags();

  // console.log(await client.getManifest(tagList[0]));

  const allTags: any = {};
  Object.values(tagList).forEach(tag => {
    allTags[tag] = {
      tag,
      // imageSizeBytes: manifestEntry.imageSizeBytes,
      // timeCreatedMs: parseInt(manifestEntry.timeCreatedMs),
      // timeUploadedMs: parseInt(manifestEntry.timeUploadedMs)
    };
  });

  // Sort by date
  // let tags = Object.values(allTags);
  // tags = tags.sort((a, b) => {
  //   return b.timeUploadedMs - a.timeUploadedMs;
  // });
  return Object.values(allTags);
};
