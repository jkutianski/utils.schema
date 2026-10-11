# utils.schema

This repository contains shared utilities used by other packages in the
`.schema` family. It is not a standalone module to install or publish to npm;
it is included as a Git submodule in repositories that need these functions,
such as `express.schema` and `fastify.schema`.

## Use by other packages

This repository's code is consumed by repositories that include it as a
submodule. When preparing those packages for publication, their built or
packaged files must include the shared code they need; they must not depend on
users installing this repository separately.

This repository is marked private in npm (`"private": true`) to prevent
accidental publication as a standalone package.
