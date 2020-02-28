export type DockerUrl = {
  // hub.docker.com
  registry: string|null,
  // elsdoerfer
  namespace: string|null
  // k8s-snapshots
  image: string,
  // latest
  tag: string|null,

  // elsdoerfer/repository
  repository: string,
  // hub.docker.com/elsdoerfer/repository
  name: string,
  // hub.docker.com/elsdoerfer/repository:latest
  fullname: string,
}


export default function(image: string): DockerUrl {
  var match = image.match(
    /^(?:([^\/]+)\/)?(?:([^\/]+)\/)?([^@:\/]+)(?:[@:](.+))?$/
  );
  if (!match) {
    throw new Error("Invalid image url.")
  }

  var registry = match[1];
  var namespace = match[2];
  var image = match[3];
  var tag = match[4];

  if (!namespace && registry && !/[:.]/.test(registry)) {
    namespace = registry;
    registry = null;
  }


  let repository = buildFull({namespace, image});
  let name = buildFull({registry, namespace, image, tag});
  let fullname = buildFull({registry, namespace, image});

  return {
    registry,
    namespace,
    image,
    tag,
    name,
    fullname,
    repository
  };
};


export function buildFull(opts: {image: string, registry?: string, namespace: string, tag?: string}): string {
  let {registry, namespace, tag, image} = opts;

  registry = registry ? registry + "/" : "";
  namespace = namespace && namespace !== "library" ? namespace + "/" : "";
  tag = tag && tag !== "latest" ? ":" + tag : "";

  let name = registry + namespace + image + tag;
  return name;
}