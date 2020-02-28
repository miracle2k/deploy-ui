import fetch from 'node-fetch';
import parseDockerUrl, {DockerUrl} from "./parseDockerUrl";
import * as querystring from 'querystring';
import * as mod_url from 'url';
// @ts-ignore
import parsers from 'www-authenticate/lib/parsers';


// We do this ourselves with fetch, as there does not seem to be any active client library around.
class Client {
  client: any;

  private dockerCfgAuth: any;
  private parsedRepo: DockerUrl;
  private authInfo: any;

  constructor(repo: string, dockercfg: any) {
    const parsedRepo = parseDockerUrl(repo);
    // This is the new format.
    if (dockercfg?.auths) {
      dockercfg = dockercfg?.auths
    }
    const auth = dockercfg ? dockercfg[`https://${parsedRepo.registry}`] || {} : {};

    this.dockerCfgAuth = auth;
    this.parsedRepo = parsedRepo;
  }

  get host() {
    return this.parsedRepo.registry ? `https://${this.parsedRepo.registry}` : 'https://registry-1.docker.io';
  }

  async login() {
    // https://github.com/joyent/node-docker-registry-client/blob/master/lib/registry-client-v2.js#L884
    //const registryHost = this.parsedRepo.registry || ""

    // Do a ping first
    const response = await fetch(`${this.host}/v2/`, {
      headers: {
      }
    }).catch(e => e);

    const wwwAuthHeader = response.headers.get('www-authenticate');

    const scope = `repository:${this.parsedRepo.repository}:pull`;

    let authInfo: AuthInfo;

    if (!wwwAuthHeader) {
      this.authInfo = {};
      return;
    }


    const authChallenge = _parseWWWAuthenticate(wwwAuthHeader);

    if (authChallenge.scheme.toLowerCase() === 'basic') {
      authInfo = {
        username: this.dockerCfgAuth?.username,
        password: this.dockerCfgAuth?.password
      }
    }
    else if (authChallenge.scheme.toLowerCase() === 'bearer') {
      const token = await getOAuthToken({
        indexName: this.parsedRepo.registry,
        realm: authChallenge.parms.realm,
        service: authChallenge.parms.service,
        scopes: scope ? [scope] : [],
        username: this.dockerCfgAuth?.username,
        password: this.dockerCfgAuth?.password,
      });
      authInfo = {
        token: token
      };
    }
    else {
      throw new Error("Unknown auth scheme")
    }

    this.authInfo = authInfo;
  }

  async ensureLogin() {
    if (!this.authInfo) {
      await this.login();
    }
  }

  async fetch(path: string, headers?: any) {
    await this.ensureLogin();

    const response = await fetch(`${this.host}/v2/${this.parsedRepo.repository}${path}`, {
      headers: {
        ...getAuthHeaders(this.authInfo),
        ...headers
      }
    });
    if (!response.ok) {
      throw new Error("error in http request: " + response.statusText);
    }
    return await response.json();
  }

  async getTags(): Promise<string[]> {
    const json = await this.fetch(`/tags/list`, {});
    return json.tags;
  }

  async getManifest(tag: string): Promise<any> {
    return await this.fetch(`/manifests/${tag}`, {
      'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
    });
  }

  async getBlob(digestId: string): Promise<any> {
    return await this.fetch(`/blobs/${digestId}`, {});
  }
}



function _parseWWWAuthenticate(header: string) {
  var parsed = new parsers.WWW_Authenticate(header);
  if (parsed.err) {
    throw new Error('could not parse WWW-Authenticate header "' + header
        + '": ' + parsed.err);
  }
  return parsed;
}


export const getAvailableImages = async function getAvailableImages(
  imageName: string,
  dockercfg: any
) {
  // Parse image
  const { registry, namespace, image, tag, fullname } = parseDockerUrl(imageName);

  const client = new Client(
    fullname,
    dockercfg
  );
  const tagList = (await client.getTags());

  const manifests = await Promise.all(tagList.map(async tag => {
    const manifest = await client.getManifest(tag);
    const digest = manifest.config.digest;
    return await client.getBlob(digest);
  }));

  const allTags: any = {};
  Object.values(tagList).forEach((tag, idx) => {
    const manifest = manifests[idx];
    allTags[tag] = {
      tag,
      // imageSizeBytes: manifestEntry.imageSizeBytes,
      created: manifest.created,
    };
  });

  // Sort by date
  let tags = Object.values(allTags);
  tags = tags.sort((a, b) => {
    // @ts-ignore
    return new Date(b.created) - new Date(a.created);
  });
  return tags;
};


type AuthInfo = {
  token?: string,
  username?: string,
  password?: string
};


function getAuthHeaders(authInfo: AuthInfo) {
  if (authInfo.token) {
    return {
      'authorization': 'Bearer ' + authInfo.token
    };
  } else if (authInfo.username) {
    var buffer = new Buffer(authInfo.username + ':' + authInfo.password, 'utf8');
    return {
      'authorization': 'Basic ' + buffer.toString('base64')
    };
  }
  return {};
}


// From https://github.com/joyent/node-docker-registry-client/blob/4bd12bd0e9bc531b5b16f881dffc69f2290f17ec/lib/registry-client-v2.js#L263
async function getOAuthToken(opts: {
  indexName: string,
  realm: string,
  service?: string,
  scopes?: string[],
  username?: string,
  password?: string,

  insecure?: boolean
}) {
  //
  // // HTTP client opts:
  // assert.object(opts.log, 'opts.log');
  // assert.optionalObject(opts.agent, 'opts.agent');
  // // assert.optional object or bool(opts.proxy, 'opts.proxy');
  // assert.optionalBool(opts.insecure, 'opts.insecure');
  // assert.optionalString(opts.userAgent, 'opts.userAgent');

  // - add https:// prefix (or http) if none on 'realm'
  var tokenUrl = opts.realm;
  var match = /^(\w+):\/\//.exec(tokenUrl);
  if (!match) {
    tokenUrl = (opts.insecure ? 'http' : 'https') + '://' + tokenUrl;
  } else if (['http', 'https'].indexOf(match[1]) === -1) {
    new Error('unsupported scheme for ' +
        `WWW-Authenticate realm "${opts.realm}": "${match[1]}"`);
  }

  // - GET $realm
  //      ?service=$service
  //      (&scope=$scope)*
  //      (&account=$username)
  //   Authorization: Basic ...
  var headers = {};
  var query: any = {};
  if (opts.service) {
    query.service = opts.service;
  }
  if (opts.scopes && opts.scopes.length) {
    query.scope = opts.scopes;  // intentionally singular 'scope'
  }

  if (opts.username) {
    query.account = opts.username;
    headers = {
      ...headers,
      ...getAuthHeaders({
       username: opts.username,
       password: opts.password
     })
    };
  }
  if (Object.keys(query).length) {
    tokenUrl += '?' + querystring.stringify(query);
  }

  const parsedUrl = mod_url.parse(tokenUrl);

  const response = await fetch(
    `${parsedUrl.protocol + '//' + parsedUrl.host}${parsedUrl.path}`,
    {
      headers: {
        ...headers
      }
    }
  );

  const body = (await response.json());

  if (!response.ok) {
    if (response.status === 401) {
      // Convert *all* 401 errors to use a generic error constructor
      // with a simple error message.
      var errMsg = _getRegistryErrorMessage(body);
      throw new Error(errMsg);
    }
    throw new Error(response.statusText);
  }
  else if (!body.token) {
    throw new Error('authorization ' +
        'server did not include a token in the response');
  }

  return body.token;
}


function _getRegistryErrorMessage(err: any) {
  if (err.body && Array.isArray(err.body.errors) && err.body.errors[0]) {
    return err.body.errors[0].message;
  } else if (err.body && err.body.details) {
    return err.body.details;
  } else if (Array.isArray(err.errors) && err.errors[0].message) {
    return err.errors[0].message;
  } else if (err.message) {
    return err.message;
  }
  return err.toString();
}