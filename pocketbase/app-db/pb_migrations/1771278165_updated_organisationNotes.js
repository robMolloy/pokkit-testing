/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1115152794")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && \n@collection.organisationUserPermissions.userId ?= @request.auth.id && \n@collection.organisationUserPermissions.organisationId ?= organisationId && \n@collection.organisationUserPermissions.role ?= \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1115152794")

  // update collection data
  unmarshal({
    "createRule": null
  }, collection)

  return app.save(collection)
})
