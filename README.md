Development
-----------

    $ cd client && yarn run start
    $ cd backend && yarn run start

Current Status: Not Deployed (in up-to-date version).
Only local usage possible.


Work directly with the Registry API
-----------------------------------

This is useful for debugging:

    IMAGE=library/redis
    TAG=latest
    TOKEN=$(curl -s "https://auth.docker.io/token?scope=repository:$IMAGE:pull&service=registry.docker.io" | jq -r .token)

    curl -s -H"Accept: application/vnd.docker.distribution.manifest.v2+json" -H"Authorization: Bearer $TOKEN" "https://registry-1.docker.io/v2/$IMAGE/manifests/$TAG"

    CONFIG_DIGEST=$(curl -s -H"Accept: application/vnd.docker.distribution.manifest.v2+json" -H"Authorization: Bearer $TOKEN" "https://registry-1.docker.io/v2/$IMAGE/manifests/$TAG" | jq -r .config.digest)
    curl -sL -H"Authorization: Bearer $TOKEN" "https://registry-1.docker.io/v2/$IMAGE/blobs/$CONFIG_DIGEST"


Notes
-----

The v2 registry requires a lot of calls to query the data we need (dates, labels), so we probably need
to cache the data.

See for a discussion of these issues;

- https://forums.docker.com/t/retrieve-image-labels-from-manifest/37784

There seems to be private API just for docker hub:

https://github.com/RyanTheAllmighty/Docker-Hub-API
  (https://github.com/RyanTheAllmighty/Docker-Hub-API/issues/23)

Other projects
--------------

- Registry UI: https://github.com/Joxit/docker-registry-ui
