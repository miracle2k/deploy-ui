const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { client } = require("./k8s");
const { getAvailableImages } = require("./registry");
const parseDockerUrl = require("./parseDockerUrl").default;

const app = express();
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "/../client/build")));

function parseResource(resource) {
  const [nsName, resourceName] = resource.split("/");
  return { namespace: nsName, resource: resourceName };
}

function patchDockerUrl(url, changes) {
  const parts = parseDockerUrl(url);
  const newParts = Object.assign({}, parts, changes);
  const { registry, namespace, repository, tag } = newParts;
  return `${registry}/${namespace}/${repository}:${tag}`;
}

app.post("/api/deployment/*", async (req, res) => {
  const { namespace, resource } = parseResource(req.params[0]);
  const newTag = req.body.tag;
  const name = req.body.name;

  const deployment = await extClient
    .ns(namespace)
    .deployments(resource)
    .getPromise();
  const newImage = patchDockerUrl(
    deployment.spec.template.spec.containers[0].image,
    { tag: newTag }
  );

  extClient
    .ns(namespace)
    .deployments(resource)
    .patch(
      {
        body: {
          spec: {
            template: {
              spec: {
                containers: [
                  {
                    name: name,
                    image: newImage
                  }
                ]
              }
            }
          }
        }
      },
      function(err, success) {
        if (err) {
          console.log("error querying kubernetes", err);
          res.json({ error: "" + err });
        } else {
          res.json({
            deployment: {
              image: newImage,
              success
            }
          });
        }
      }
    );
});


app.get("/api/deployment/*", async (req, res) => {
  const name = req.params[0];

  const { namespace: nsName, resource: deploymentName } = parseResource(name);

  let deployment = await client.apis.apps.v1
    .namespaces(nsName)
    .deployments(deploymentName)
    .get();
  deployment = deployment.body;
  const containers = deployment.spec.template.spec.containers;

  let dockercfg;
  if (deployment.spec.template.spec.imagePullSecrets) {
    const secrets = deployment.spec.template.spec.imagePullSecrets;
    // Get the secret
    let secret = await client.api.v1.namespace(nsName)
      .secrets(secrets[0].name)
      .get();
    secret = secret.body;
    dockercfg = JSON.parse(
      Buffer.from(secret.data[".dockercfg"] || secret.data['.dockerconfigjson'], "base64").toString("ascii")
    );
  }

  const containerData = await Promise.all(
    containers.map(async container => {
      return {
        name: container.name,
        image: container.image,
        imageParts: parseDockerUrl(container.image),
        availableImages: await getAvailableImages(container.image, dockercfg)
      };
    })
  );

  res.json({
    deployment: {
      containers: containerData
    }
  });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/../client/build/index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`Listening on ${port}`);
