type DockerUrl = {
  // hub.docker.com
  registry: string|null,
  // elsdoerfer
  namespace: string|null
  // k8s-snapshots
  repository: string,
  // latest
  tag: string|null,

  name: string,
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
  var repository = match[3];
  var tag = match[4];

  if (!namespace && registry && !/[:.]/.test(registry)) {
    namespace = registry;
    registry = null;
  }


  let name = buildFull({registry, namespace, repository, tag});
  let fullname = buildFull({registry, namespace, repository});

  return {
    registry,
    namespace,
    repository,
    tag,
    name,
    fullname
  };
};


export function buildFull(opts: {repository: string, registry: string, namespace: string, tag?: string}): string {
  let {registry, namespace, tag, repository} = opts;

  registry = registry ? registry + "/" : "";
  namespace = namespace && namespace !== "library" ? namespace + "/" : "";
  tag = tag && tag !== "latest" ? ":" + tag : "";

  let name = registry + namespace + repository + tag;
  return name;
}