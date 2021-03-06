// @ts-ignore
import express from 'express';
import {Request, Response} from 'express';
const path = require("path");
const bodyParser = require("body-parser");
const { client } = require("./k8s");
import { getAvailableImages } from "./registry";
const parseDockerUrl = require("./parseDockerUrl").default;
import {buildFull} from './parseDockerUrl';


const app = express();
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "/../client/build")));


function parseResource(resource: string) {
  const [nsName, resourceName] = resource.split("/");
  return { namespace: nsName, resource: resourceName };
}


function patchDockerUrl(url: string, changes: any) {
  const parts = parseDockerUrl(url);
  const newParts = Object.assign({}, parts, changes);
  const { registry, namespace, image, tag } = newParts;
  return buildFull({registry, namespace, image, tag});  
}

app.post("/api/deployment/*", async (req: Request, res: Response) => {
  const { namespace, resource } = parseResource(req.params[0]);
  const newTag = req.body.tag;
  const name = req.body.name;

  const deployment = await client.apis.apps.v1
    .namespaces(namespace)
    .deployments(resource)
    .get();

  const newImage = patchDockerUrl(
    deployment.body.spec.template.spec.containers[0].image,
    { tag: newTag }
  );

  client.apis.apps.v1
    .namespaces(namespace)
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
      function(err: any, success: any) {
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


app.get("/api/deployment/*", async (req: Request, res: Response) => {
  const name = req.params[0];

  const { namespace: nsName, resource: deploymentName } = parseResource(name);

  let deployment = await client.apis.apps.v1
    .namespaces(nsName)
    .deployments(deploymentName)
    .get();
  deployment = deployment.body;
  const containers = deployment.spec.template.spec.containers;

  let dockercfg: any;
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
    containers.map(async (container: any) => {
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
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname + "/../client/build/index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`Listening on ${port}`);
